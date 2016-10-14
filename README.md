yarnrc
=====

Switch between different .yarnrc files with ease and grace.

Overview
--------
This is a adapted version of npmrc([npmrc](https://github.com/deoxxa/npmrc)) to work
with the new package manager released by Facebook called Yarn. 
If you use a private npm registry, you know the pain of switching between a
bunch of different .yarnrc files and manually managing symlinks. Let that be a
problem no more! `yarnrc` is here to save the day, by making it dead simple to
switch out your .yarnrc with a specific named version. It also tries to protect
you from your own stupid self by making sure you don't accidentally overwrite an
.yarnrc that you actually want to keep.


Installation
------------

``` sh
npm install -g yarnrc
```

Usage
-----

```
➜  ~  yarnrc --help

yarnrc

  Switch between different .yarnrc files with ease and grace.

Usage:
  yarnrc                 list all profiles
  yarnrc [name]          change yarnrc profile (uses fuzzy matching)
  yarnrc -c [name]       create a new yarnrc profile called name
  yarnrc -r [registry]   use an npm mirror

Available mirrors for yarnrc -r:
  au      - Australian registry mirror
  eu      - European registry mirror
  cn      - Chinese registry mirror
  default - Default registry
```

#### Initialisation

Calling `yarnrc` without arguments creates an `~/.yarnrcs/` directory if it doesn't exist,
and copies your current `~/.yarnrc` as the 'default' .yarnrc profile.

```
➜  ~  yarnrc
Creating /Users/conrad/.yarnrcs
Making /Users/conrad/.yarnrc the default yarnrc file
Activating .yarnrc 'default'
```

#### Create a new .yarnrc profile

```
➜  ~  yarnrc -c newprofile
Removing old .yarnrc (/home/rvagg/.yarnrcs/default)
Activating .yarnrc 'newprofile'
```

A blank profile will be created. To point your profile to a non-default registry:

```
➜  ~  npm config set registry http://npm.nodejs.org.au:5984/registry/_design/app/_rewrite
```

Then use `npm adduser` or `npm login` to authenticate with the new profile.


#### List available .yarnrc profiles

```
➜  ~  yarnrc
Available yarnrcs:

* default
  work
```

#### Switch to a specific .yarnrc

```
➜  ~  yarnrc work
Removing old .yarnrc (/Users/conrad/.yarnrcs/default)
Activating .yarnrc 'work'
```

You can also pass only the first few characters of a profile and `yarnrc` will
autocomplete the profile's name.

```
➜  ~  yarnrc def
Removing old .yarnrc (/Users/conrad/.yarnrcs/work)
Activating .yarnrc 'default'
```

`yarnrc <name>` will also go to some lengths to make sure you don't overwrite
anything you might care about:

```
➜  ~  yarnrc default
Removing old .yarnrc (/Users/conrad/.yarnrcs/work)
Activating .yarnrc 'default'
➜  ~  yarnrc default  
Current .yarnrc (/Users/conrad/.yarnrc) is already 'default' (/Users/conrad/.yarnrcs/default)
➜  ~  rm ~/.yarnrc
➜  ~  touch ~/.yarnrc
➜  ~  yarnrc default
Current .yarnrc (/Users/conrad/.yarnrc) is not a regular file, not removing it
➜  ~  rm ~/.yarnrc
➜  ~  yarnrc default
Activating .yarnrc 'default'
```

Note For Windows Users
----------------------

You may have to run yarnrc in a shell (cmd, PowerShell, Git Bash, etc) with
elevated (Administrative) privileges to get it to run.

Environment Variables
---------------------

* `YARNRC_STORE` - Path to directory of profiles. Default: `~/.yarnrcs/`
* `YARNRC` - Path to the yarnrc file used by npm. Default: `~/.yarnrc`

Known npm registry Mirrors
---------------------

For your convenience, you can change registries easily using the `-r`
flag. Currently we provide aliases for:

* [Australia](http://registry.npmjs.org.au/): `yarnrc -r au`
* [Europe](http://registry.npmjs.eu/): `yarnrc -r eu`
* [China](http://r.cnpmjs.org): `yarnrc -r cn`

#### Switching registry example

```
➜  ~  npm -r eu
Using eu registry
➜  ~  npm info yarnrc
npm http GET http://registry.npmjs.eu/yarnrc
^C
➜  ~  npm -r default
Using default registry
➜  ~  npm info yarnrc
npm http GET https://registry.npmjs.org/yarnrc
^C
```

License
-------

3-clause BSD. A copy is included with the source.

Contact
-------

* GitHub ([Vitorcamacho](https://github.com/Vitorcamacho/yarnrc))
* Twitter ([@vitorcamachooo](https://twitter.com/vitorcamachooo))
* Email ([vcamacho.91@gmail.com](vcamacho.91@gmail.com))

Awesome People
--------------

* deoxxa "the creator" of npmrc([github](https://github.com/deoxxa))
* Jaime "the binary wizard" Pillora ([github](https://github.com/jpillora))
* Tim "two hands" Oxley ([github](https://github.com/timoxley))
* Jakob "fastest blur in the west" Krigovsky ([github](https://github.com/SonicHedgehog))
* Rod "the destroyer" Vagg ([github](https://github.com/rvagg))
* Eugene "ludicrous gibs" Asiedu ([github](https://github.com/ngenerio))
