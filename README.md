# Nairo

Project builder and provisioning tool, to automate development workflows that work with an in-house agency team, especially using:

* WordPress Composer starter
* Vagrant
* AWS

You can take snippets or if your workflow is the same, use this in its entirety for your own development team.

It's still undergoing progress. I'm also applying functional programming principles slowly as I go and would like to add asynchronicity using monads.

## Commands

#### Setup Wordpress Composer starter with Vagrant and yarn

```
nairo setup:wordpress-starter -r GIT_REPOSITORY -d PROJECT_FOLDER
```

Example

```
nairo setup:wordpress-starter -r git@github.com:gemmadlou/WordPress-Composer-Starter.git -d PROJECT_FOLDER
```

## FAQs

#### How to Vagrant up without entering a password

If you use a Mac then add this to your sudo file by:

```
sudo visudo
```

```
Cmnd_Alias VAGRANT_EXPORTS_ADD = /usr/bin/tee -a /etc/exports
Cmnd_Alias VAGRANT_NFSD = /sbin/nfsd restart
Cmnd_Alias VAGRANT_EXPORTS_REMOVE = /usr/bin/sed -E -e /*/ d -ibak /etc/exports
%admin ALL=(root) NOPASSWD: VAGRANT_EXPORTS_ADD, VAGRANT_NFSD, VAGRANT_EXPORTS_REMOVE
```

If you use anything else, take a look at this:

https://askubuntu.com/questions/412525/vagrant-up-and-annoying-nfs-password-asking 