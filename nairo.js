#!/usr/bin/env node

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
    let execution = shell.exec(command)
    if (execution.code !== 0) {
        stopShell(execution.stderr)
    }
}

let installNodeModules = ({ dir }) => {
    if (dir === undefined) {
        return Left(new Error('directory cannot be undefined'));
    }

    return Right(`cd ${dir} && yarn install`);
}

shell.echo('GO NAIRO!');

program
    .version('0.0.1', '-v, --version');

program
    .command('setup')
    .option('-b, --branch <branch>', 'Git branch')
    .option('-r, --repo <repo>', 'Git repository you want to clone')
    .option('-d, --dir <dir>', 'Project directory')
    .action((cmd) => {
        clone({ repo: cmd.repo, branch: cmd.branch, dir: cmd.dir })
            .cata(stopShell, executeShell);

        installComposer({ dir: cmd.dir })
            .cata(stopShell, executeShell);

        installNodeModules({ dir: cmd.dir })
            .cata(stopShell, executeShell);
    })

program.parse(process.argv);
