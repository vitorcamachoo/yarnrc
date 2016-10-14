#!/usr/bin/env node

const path = require('path')
    , fs   = require('fs')
    , os = require('os');

const YARNRC_STORE = process.env.YARNRC_STORE || path.join(process.env.HOME || process.env.USERPROFILE, '.yarnrcs')
    , YARNRC       = process.env.YARNRC || path.join(process.env.HOME || process.env.USERPROFILE, '.yarnrc')
    , registries    = {
        au: 'http://registry.npmjs.org.au/'
      , eu: 'http://registry.npmjs.eu/'
      , cn: 'http://r.cnpmjs.org/'
      , defaultReg: 'https://registry.npmjs.org/'
    }
    , USAGE       = 'Usage:\n'
                  + '  yarnrc                 list all profiles\n'
                  + '  yarnrc [name]          change yarnrc profile (uses fuzzy matching)\n'
                  + '  yarnrc -c [name]       create a new yarnrc profile called name\n'
                  + '  yarnrc -r [registry]   use an npm mirror\n\n'
                  + 'Available mirrors for yarnrc -r:\n'
                  + '  au      - Australian registry mirror\n'
                  + '  eu      - European registry mirror\n'
                  + '  cn      - Chinese registry mirror\n'
                  + '  default - Default registry\n'

var opts
  , name

function printUsage () {
  console.error(USAGE)
  process.exit(1)
}


function printHelp () {
  process.stdout.write(
      'yarnrc\n'
    + '\n'
    + '  Switch between different .yarnrc files with ease and grace.\n\n'
    + USAGE
    + '\n'
    + 'Example:\n\n'
    + '  # Creating and activating a new .yarnrc called "work":\n'
    + '  $ yarnrc -c work\n\n'
    + '  # Switch betwen "work" and "default"\n'
    + '  $ yarnrc work\n'
    + '  $ yarnrc default\n'
    + '  # Use the European npm mirror'
    + '  $ yarnrc -r eu\n'
  )
  process.exit(1)
}


function printNpmrcs () {
  console.log('Available yarnrcs:\n')
  fs.readlink(YARNRC, function (err, link) {
    link = link && path.basename(link)
    fs.readdirSync(YARNRC_STORE).forEach(function (yarnrc) {
      if (yarnrc[0] !== '.') {
        console.log(' %s %s', link == yarnrc ? '*' : ' ', yarnrc)
      }
    })
  })
}


// safety check so we don't go overwriting accidentally
function checkSymlink (stat) {
  if (!stat.isSymbolicLink()) {
    console.log('Current .yarnrc (%s) is not a symlink. You may want to copy it into %s.', YARNRC, YARNRC_STORE)
    process.exit(1)
  }
}

// make the symlink
function link (name) {
  var ln = path.join(YARNRC_STORE, name || '')
    , stat

  if (ln == YARNRC_STORE || !fs.existsSync(ln)) {
    console.error('Couldn\'t find yarnrc file "%s".', name)
    return process.exit(1)
  }

  try {
    stat = fs.lstatSync(YARNRC)
    checkSymlink(stat)
  } catch (e) {}

  if (stat) {
    console.log('Removing old .yarnrc (%s)', path.basename(fs.readlinkSync(YARNRC)))
    fs.unlinkSync(YARNRC)
  }

  console.log('Activating .yarnrc "%s"', path.basename(ln))
  fs.symlinkSync(ln, YARNRC, 'file')
}

// partial match yarnrc names
function partialMatch(match, files) {
  files.sort() // own the sort order

  // try exact match
  var exactMatch = files.filter(function(file) {
    return file === match
  }).shift()
  if (exactMatch) return exactMatch

  // try starts with match
  var matchesStart = files.filter(function(file) {
    return file.indexOf(match) === 0
  }).shift()
  if (matchesStart) return matchesStart

  // try whatever match
  var matchesAnything = files.filter(function(file) {
    return file.match(new RegExp(match))
  }).shift()
  if (matchesAnything) return matchesAnything
}

// simplistic cmdline parser, sets "name" as the first non-'-' arg
// and sets "opts" as '-'-stripped characters (first char only)
;(function processCmdline () {
  opts = process.argv.slice(2).map(function (a) {
    return a[0] == '-' && a.replace(/^-+/, '')[0]
  }).filter(Boolean)

  name = process.argv.slice(2).filter(function (a) {
    return a[0] != '-'
  })[0] // first non '-' arg

  opts.filter(function (o) {
    if (o == 'c' || o == 'h' || o == 'r' || o === 'registry') // other known opts go here
      return false

    console.error('Unknown option: -' + o)
    return true
  }).length && printUsage()

  if (opts.indexOf('h') > -1)
    printHelp()
}())


// set up .yarnrc if it doesn't exist
;(function makeStore () {
  function make () {
    var def = path.join(YARNRC_STORE, 'default')

    console.log('Initialising yarnrc...')
    console.log('Creating %s', YARNRC_STORE)

    fs.mkdirSync(YARNRC_STORE)

    if (fs.existsSync(YARNRC)) {
      console.log('Making %s the default yarnrc file', YARNRC)
      fs.renameSync(YARNRC, def)
    } else {
      fs.writeFileSync(def, '')
    }

    link('default')
    process.exit(0)
  }

  try {
    var stat = fs.statSync(YARNRC_STORE)
    if (!stat.isDirectory()) {
      console.error('Error: %s is not a directory', YARNRC_STORE)
      process.exit(1)
    }
  } catch (e) {
    make()
  }
}())


// no name and no args
if (!name && !opts.length)
  return printNpmrcs()


;(function handleOPtions() {
  if (~opts.indexOf('c'))
    createNew()
  else if (~opts.indexOf('r') || ~opts.indexOf('registry'))
    replaceRegistry()
}())

// handle -r <name>
function replaceRegistry() {
  if (!name) {
    console.error('Specify the registry you want to use')
    return printUsage()
  }

  var registry = registries[(name === 'slow' || name === 'default') ? 'defaultReg' : name]
    , fileContents

  try {
    fs.existsSync(YARNRC)
  } catch (e) {
    console.warn('Make sure a .yarnrc file exits at %s.', YARNRC)
    process.exit(1)
  }

  if (!registry) {
    console.error('%s value is not a valid registry name', name)
    printUsage()
  }

  fileContents = fs.readFileSync(YARNRC, 'utf8').split(os.EOL)

  for (var i = 0, l = fileContents.length; i <  l; i++) {
    if (~fileContents[i].indexOf('registry')) {
      fileContents[i] = 'registry = ' + registry
      break;
    }
  }

  if (i === l)
    fileContents.unshift('registry = ' + registry)
  fs.writeFileSync(YARNRC, fileContents.join(os.EOL))

  console.log('Using %s registry.', registry)
  process.exit(0)
}

// handle -c <name>
function createNew () {
  if (!name) {
    console.error('What do you want to call your new npm configuration?')
    return printUsage()
  }

  var c = path.join(YARNRC_STORE, name)
  if (fs.existsSync(c)) {
    console.log('yarnrc file "%s", already exists (%s/%s)', name, YARNRC_STORE, name)
    return process.exit(1)
  }

  fs.writeFileSync(c, '')
}


if (name) name = partialMatch(name, fs.readdirSync(YARNRC_STORE)) || name

// sanity/safety check, also check if they want to switch
// to the already active one
;(function checkExisting () {
  var stat
  try {
    stat = fs.lstatSync(YARNRC)
    checkSymlink(stat)
  } catch (e) {
    // ignore
  }

  if (name && stat && fs.readlinkSync(YARNRC) == path.join(YARNRC_STORE, name)) {
    console.log('Current .yarnrc (%s) is already "%s" (%s/%s)', YARNRC, name, YARNRC_STORE, name)
    return process.exit(0)
  }
}())

// if we got here, then we're ready to switch
link(name)
