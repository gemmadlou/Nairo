#!/usr/bin/env node

let fs = require('fs');
let { resolve } = require('path');
let shell = require('shelljs');
let program = require('commander');
let { Maybe, Either, Right, Left } = require('monet');

let clone = ({repo, dir}) => {
    if (repo === undefined) {
        return Left(new Error('repository option cannot be undefined'));
    }

    if (dir === undefined) {
        return Left(new Error('directory option cannot be undefined'));
    }

    return Right(`git clone ${repo} ${dir}`);
}

let installComposer = ({ dir }) => {
    if (dir === undefined) {
        return Left(new Error('directory cannot be undefined'));
    }

    return Right(`composer install -d ${dir}`);
}

let stopShell = (error) => {
    shell.echo(`Nairo stopped because of an error`);
    shell.echo(error.toString());
    shell.exit(1);
}

let executeShell = (command) => {
    let { stdout, stderr, code } = shell.exec(command)
    shell.echo(stdout);
    if (code !== 0) {
        stopShell(stderr)
    }
}

let writeFile = ({ path, content, encoding = 'utf8'}) => {
    return fs.writeFileSync(path, content, { encoding })
}

let installNodeModules = ({ dir }) => {
    if (dir === undefined) {
        return Left(new Error('directory cannot be undefined'));
    }

    return Right(`cd ${dir} && yarn install`);
}

let vagrantConfig = (ip = '192.168.33.22') => `
    # -*- mode: ruby -*-
    # vi: set ft=ruby :
    Vagrant.configure("2") do |config|
        config.vm.box = "scotch/box"
        config.vm.network "private_network", ip: "${ip}"
        config.vm.hostname = "scotchbox"
        
        # Optional NFS. Make sure to remove other synced_folder line too
        config.vm.synced_folder ".", "/var/www", :nfs => { :mount_options => ["dmode=777","fmode=666"] }
    end 
`;

let setupVagrant = ({ dir, ip }) => {
    if (dir === undefined) {
        return Left(new Error('When setting up the directory cannot be undefined'));
    }

    let content = vagrantConfig(ip);
    
    return Right({
        path: resolve(dir) + '/Vagrantfile',
        content
    })
}

let makeProjectDirectoryCmd = ({ dir }) => {
    if (dir === undefined) {
        return Left(new Error('When setting up the directory cannot be undefined'));
    }

    return Right(`mkdir -p ${dir}`);
}

let launchVagrant = ({ dir }) => {
    if (dir === undefined) {
        return Left(new Error('When launching Vagrant the directory cannot be undefined'));
    }

    return Right(`cd ${dir} && vagrant up && cat Vagrantfile`);
}

let copyEnvironmentFileCmd = ({ dir, sampleEnvFile = '.env.example', envFile = '.env' }) => {
    if (dir === undefined) {
        return Left(new Error('When copying the environment file, the project directory cannot be undefined'));
    }

    return Right(`cp ${dir}/${sampleEnvFile} ${dir}/${envFile}`);
}

let tarWPUploadsCmd = ({ projectFolder }) => {

    if (projectFolder === undefined) {
        return Left(new Error('You must define the projectFolder'));
    }

    return Right(`tar -czvf ~/${projectFolder}.temp.tar.gz /var/www/vhosts/${projectFolder}/public/wp-content/uploads`);
}

let remoteSSH = ({ privateKeyPath, hostname, username = 'centos', command }) => {
    if (command === undefined) {
        return Left(new Error('ssh command must be defined'));
    }

    if (hostname === undefined) {
        return Left(new Error('ssh hostname must be set'));
    }

    return Right(`ssh ${privateKeyPath ? `-i ${privateKeyPath}` : ''} ${username}@${hostname} "${command}"`)
}

let downloadWPFile = ({ privateKeyPath, hostname, projectFolder, username = 'centos' }) => {
    if (hostname === undefined) {
        return Left(new Error('ssh hostname must be set'));
    }

    if (projectFolder === undefined) {
        return Left(new Error('You must define the projectFolder'));
    }

    return Right(`scp ${privateKeyPath ? `-i ${privateKeyPath}` : ''} ${username}@${hostname}:~/${projectFolder}.temp.tar.gz ./`)
}

shell.echo('GO NAIRO!');

program
    .version('0.0.1', '-v, --version');

program
    .command('launch:wordpress-starter')
    .option('-b, --branch <branch>', 'Git branch')
    .option('-r, --repo <repo>', 'Git repository you want to clone')
    .option('-d, --dir <dir>', 'Project directory')
    .action((cmd) => {
        clone({ repo: cmd.repo, dir: cmd.dir })
            .cata(stopShell, executeShell);

        installComposer({ dir: cmd.dir })
            .cata(stopShell, executeShell);

        installNodeModules({ dir: cmd.dir })
            .cata(stopShell, executeShell);

        copyEnvironmentFileCmd({ dir: cmd.dir })
            .cata(stopShell, executeShell);

        launchVagrant({ dir: cmd.dir })
            .cata(stopShell, executeShell);
    });

program
    .command('setup:vagrantfile')
    .option('-d, --dir <dir>', 'Project directory')
    .action((cmd) => {
        makeProjectDirectoryCmd({ dir: cmd.dir })
            .cata(stopShell, executeShell);

        setupVagrant({ dir: cmd.dir })
            .cata(stopShell, writeFile);
    });

program
    .command('launch:vagrant')
    .option('-d, --dir <dir>', 'Project directory')
    .action((cmd) => {
        launchVagrant({ dir: cmd.dir })
            .cata(stopShell, executeShell);
    });

program
    .command('setup:envfile')
    .option('-d, --dir <dir>', 'Project directory')
    .action((cmd) => {
        copyEnvironmentFileCmd({ dir: cmd.dir })
            .cata(stopShell, executeShell);
    });

program
    .command('grab:images')
    .option('-p, --project-folder <projectFolder>', 'Project folder name')
    .option('-k, --key-path <keyPath>', 'Private key path')
    .option('-h, --host <host>', 'Host name')
    .action((cmd) => {
        tarWPUploadsCmd({ projectFolder: cmd.projectFolder })
            .flatMap(command => remoteSSH({ privateKeyPath: cmd.keyPath, hostname: cmd.host, command }))
            .cata(stopShell, executeShell);

        downloadWPFile({ projectFolder: cmd.projectFolder, privateKeyPath: cmd.keyPath, hostname: cmd.host })
            .cata(stopShell, executeShell);
    });

program.parse(process.argv);
