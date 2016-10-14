const test    = require('tape')
    , path    = require('path')
    , os      = require('os')
    , fs      = require('fs')
    , rimraf  = require('rimraf')
    , mkdirp  = require('mkdirp')
    , tmpdir  = require('os').tmpDir()
    , exec    = require('child_process').exec
    , xtend   = require('xtend')

    , cmd     = '"' + process.execPath + '" '
                + path.join(__dirname, 'yarnrc.js')
    , homedir = path.join(tmpdir, '.yarnrcs_test.' + process.pid)
    , options = { env: xtend(process.env, { HOME: homedir }) }
    , yarnrc   = path.join(homedir, '.yarnrc')
    , yarnrcs  = path.join(homedir, '.yarnrcs')
    , def     = path.join(homedir, '.yarnrcs/default')
    , dotfile = path.join(homedir, '.yarnrcs/.dotfile')


function cleanup (t) {
  rimraf(homedir, t.end.bind(t))
}


test('blank slate', function (t) {
  mkdirp.sync(homedir)

  exec(cmd, options, function (err, stdout, stderr) {
    t.notOk(err, 'no error')
    t.equal(stderr, '', 'no stderr')
    t.ok(/Initialising/.test(stdout), 'got "initialising" msg')
    t.ok(/Creating .*\.yarnrcs/.test(stdout), 'got "creating" msg')
    t.ok(/Activating .yarnrc "default"/, 'got "activating" msg')
    t.end()
  })
})

test('change the registry url', function (t) {
  exec(cmd + ' -r au', options, function (err, stdout, stderr) {
    t.notOk(err, 'no error')
    t.ok(fs.existsSync(yarnrc), '.yarnrc file exists')
    t.ok(fs.existsSync(def), '.yarnrc default file exists')
    t.equal(fs.readFileSync(def, 'utf-8').split(os.EOL)[0], 'registry = http://registry.npmjs.org.au/', 'got the right registry url')
    t.end()
  })
})

test('error occurs when the wrong argument is supplied to -r', function (t) {
  exec(cmd + ' -r foo', options, function (err, stdout, stderr) {
    t.ok(err, 'error occured')
    t.equal(err.code, 1, 'process exited with the right code')
    t.end()
  })
})

test('cleanup', cleanup)


test('standard .yarnrcs', function (t) {
  mkdirp.sync(homedir)
  fs.writeFileSync(yarnrc, 'foobar', 'utf8')

  exec(cmd, options, function (err, stdout, stderr) {
    t.notOk(err, 'no error')
    t.equal(stderr, '', 'no stderr')
    t.ok(/Initialising/.test(stdout), 'got "initialising" msg')
    t.ok(/Creating .*\.yarnrcs/.test(stdout), 'got "creating" msg')
    t.ok(/Activating .yarnrc "default"/, 'got "activating" msg')
    t.ok(/Making .*\.yarnrc the default/, 'got "making default" msg')
    t.equal(fs.readFileSync(yarnrc, 'utf8'), 'foobar', 'got expected contents of .yarnrc')
    t.equal(fs.readFileSync(def, 'utf8'), 'foobar', 'got expected contents of .yarnrcs/default')
    t.ok(fs.lstatSync(yarnrc).isSymbolicLink(), '.yarnrc is symlink')
    t.equal(fs.readlinkSync(yarnrc), def, '.yarnrc points to "default"')
    t.deepEqual(fs.readdirSync(yarnrcs), [ 'default' ], 'only "default" in .yarnrcs')
    t.end()
  })
})


test('create noarg', function (t) {
  exec(cmd + ' -c', options, function (err, stdout, stderr) {
    t.ok(err, 'got error')
    t.equal(err.code, 1, 'got correct exit code')
    t.equal(stdout, '', 'no stdout')
    t.ok(/Usage/.test(stderr), 'got Usage')
    t.equal(fs.readFileSync(yarnrc, 'utf8'), 'foobar', 'got expected contents of .yarnrc')
    t.deepEqual(fs.readdirSync(yarnrcs), [ 'default' ], 'only "default" in .yarnrcs')
    t.end()
  })
})


test('create new config', function (t) {
  var foobar = path.join(yarnrcs, 'foobar')
  exec(cmd + ' -c foobar', options, function (err, stdout, stderr) {
    t.notOk(err, 'no error')
    t.equal(stderr, '', 'no stderr')
    t.ok(/Removing old .+\Wdefault\W/.test(stdout), 'got "removing" msg')
    t.ok(/Activating .yarnrc "foobar"/.test(stdout), 'got "activating" msg')
    t.equal(fs.readFileSync(yarnrc, 'utf8'), '', 'got expected contents of .yarnrc')
    t.equal(fs.readFileSync(def, 'utf8'), 'foobar', 'got expected contents of .yarnrcs/default')
    t.equal(fs.readFileSync(foobar, 'utf8'), '', 'got expected contents of .yarnrcs/foobar')
    t.ok(fs.lstatSync(yarnrc).isSymbolicLink(), '.yarnrc is symlink')
    t.equal(fs.readlinkSync(yarnrc), foobar, '.yarnrc points to "foobar"')
    t.deepEqual(fs.readdirSync(yarnrcs), [ 'default', 'foobar' ], '"default" and "foobar" in .yarnrcs')
    t.end()
  })
})


test('switch config', function (t) {
  var foobar = path.join(yarnrcs, 'foobar')
  exec(cmd + ' default', options, function (err, stdout, stderr) {
    t.notOk(err, 'no error')
    t.equal(stderr, '', 'no stderr')
    t.ok(/Removing old .+\Wfoobar\W/.test(stdout), 'got "removing" msg')
    t.ok(/Activating .yarnrc "default"/.test(stdout), 'got "activating" msg')
    t.equal(fs.readFileSync(yarnrc, 'utf8'), 'foobar', 'got expected contents of .yarnrc')
    t.equal(fs.readFileSync(def, 'utf8'), 'foobar', 'got expected contents of .yarnrcs/default')
    t.equal(fs.readFileSync(foobar, 'utf8'), '', 'got expected contents of .yarnrcs/foobar')
    t.ok(fs.lstatSync(yarnrc).isSymbolicLink(), '.yarnrc is symlink')
    t.equal(fs.readlinkSync(yarnrc), def, '.yarnrc points to "foobar"')
    t.deepEqual(fs.readdirSync(yarnrcs), [ 'default', 'foobar' ], '"default" and "foobar" in .yarnrcs')
    t.end()
  })
})


test('list config', function (t) {
  fs.writeFileSync(dotfile, '.dotfile', 'utf8');
  exec(cmd, options, function (err, stdout, stderr) {
    t.notOk(err, 'no error')
    t.equal(stderr, '', 'no stderr')
    t.ok(/Available yarnrcs/.test(stdout), 'got "Available" msg')
    t.ok((/\* default$/m).test(stdout), 'listed "default"')
    t.ok((/  foobar$/m).test(stdout), 'listed "foobar"')
    t.notOk((/\.dotfile$/m).test(stdout), 'listed "dotfile"')
    t.end()
  })
})


test('switch to non-existent config', function (t) {
  exec(cmd + ' doobar', options, function (err, stdout, stderr) {
    t.ok(err, 'got error')
    t.equal(err.code, 1, 'got correct exit code')
    t.equal(stdout, '', 'no stdout')
    t.ok(/Couldn't find yarnrc file "doobar"/.test(stderr), 'got expected error message')
    t.end()
  })
})


test('partial matching start of yarnrc', function (t) {
  exec(cmd + ' foo', options, function (err, stdout, stderr) {
    t.notOk(err, 'no error')
    t.equal(stderr, '', 'no stderr')
    t.ok(/Activating .yarnrc "foobar"/.test(stdout), 'got "activating" msg')
    t.end()
  })
})


test('partial matching prefers full match over partial', function (t) {
  exec(cmd + ' -c foo', options, function (err, stdout, stderr) {
  // create foo
    t.notOk(err, 'no error')
    // match against foobar should pick foobar not foo
    exec(cmd + ' foobar', options, function (err, stdout, stderr) {
      t.notOk(err, 'no error')
      t.equal(stderr, '', 'no stderr')
      t.ok(/Activating .yarnrc "foobar"/.test(stdout), 'got "activating" msg')
      t.end()
    })
  })
})


test('partial matching prefers start of word match over partial match', function (t) {
  exec(cmd + ' -c bar', options, function (err, stdout, stderr) { // create bar
    t.notOk(err, 'no error')
    exec(cmd + ' default', options, function (err, stdout, stderr) { // switch to default
      t.notOk(err, 'no error')
      exec(cmd + ' ba', options, function (err, stdout, stderr) {
        // ensure 'ba' switches to bar not foobar.
        t.notOk(err, 'no error')
        t.equal(stderr, '', 'no stderr')
        t.ok(/Activating .yarnrc "bar"/.test(stdout), 'got "activating" msg')
        t.end()
      })
    })
  })
})


test('partial matching can match any part of yarnrc', function (t) {
  exec(cmd + ' ooba', options, function (err, stdout, stderr) {
    t.notOk(err, 'no error')
    t.equal(stderr, '', 'no stderr')
    t.ok(/Activating .yarnrc "foobar"/.test(stdout), 'got "activating" msg')
    t.end()
  })
})


test('partial matching matches alphabetically', function (t) {
  exec(cmd + ' -c car', options, function (err, stdout, stderr) { // create car
    t.notOk(err, 'no error')
    exec(cmd + ' default', options, function (err, stdout, stderr) { // switch to default
      t.notOk(err, 'no error')
      var foobar = path.join(yarnrcs, 'foobar')
      // try match ar from bar, car, foobar
      // should pick bar
      exec(cmd + ' ar', options, function (err, stdout, stderr) {
        t.notOk(err, 'no error')
        t.equal(stderr, '', 'no stderr')
        t.ok(/Activating .yarnrc "bar"/.test(stdout), 'got "activating" msg')
        t.end()
      })
    })
  })
})

test('cleanup', cleanup)
