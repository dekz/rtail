#!/bin/sh
":" //# comment; exec /usr/bin/env node --harmony "$0" "$@"

/*!
 * server.js
 * Created by Kilian Ciuffolo on Oct 26, 2014
 * (c) 2014-2015
 */

'use strict'

const dgram          = require('dgram')
const split          = require('split')
const app            = require('express')()
const serve          = require('express').static
const http           = require('http').Server(app)
const io             = require('socket.io')()
const yargs          = require('yargs')
const debug          = require('debug')('wtail:server')
const webapp         = require('./lib/webapp')
const updateNotifier = require('update-notifier')
const pkg            = require('../package')
const syslogParse    = require('syslog-parse')

/*!
 * inform the user of updates
 */
updateNotifier({
  packageName: pkg.name,
  packageVersion: pkg.version
}).notify()

/*!
 * parsing argv
 */
let argv = yargs
  .usage('Usage: wtail-server [OPTIONS]')
  .example('wtail-server --web-port 8080', 'Use custom HTTP port')
  .example('wtail-server --udp-port 8080', 'Use custom TCP port')
  .example('wtail-server --web-version stable', 'Always uses latest stable webapp')
  .example('wtail-server --web-version unstable', 'Always uses latest develop webapp')
  .example('wtail-server --web-version 0.1.3', 'Use webapp v0.1.3')
  .option('tcp-host', {
    alias: 'th',
    default: '0.0.0.0',
    describe: 'The listening TCP hostname'
  })
  .option('tcp-port', {
    alias: 'tp',
    default: 1337,
    describe: 'The listening TCP port'
  })
  .option('web-host', {
    alias: 'wh',
    default: '0.0.0.0',
    describe: 'The listening HTTP hostname'
  })
  .option('web-port', {
    alias: 'wp',
    default: 8888,
    describe: 'The listening HTTP port'
  })
  .option('web-version', {
    type: 'string',
    describe: 'Define web app version to serve'
  })
  .help('help')
  .alias('help', 'h')
  .version(pkg.version, 'version')
  .alias('version', 'v')
  .strict()
  .argv

/*!
 * UDP sockets setup
 */
let streams = {}
var net = require('net');
var socket = new net.Socket();

function dataReceived(data) {
  let parsed = undefined;
  try   { parsed = JSON.parse(data) }
  catch (err) { debug(err); debug(data.toString()); debug('not json data') }

  if (parsed == undefined) {
    try {
      let syslog = syslogParse(data.toString());
      parsed           = {}
      parsed.timestamp = syslog.time
      parsed.id        = syslog.process
      parsed.content   = syslog.message
    }
    catch (err) { debug(err); debug(data.toString()); return debug('invalid data') }
  }

  if (parsed.id == undefined) {
    debug("Error parsing message");
    debug(data.toString());
    parsed.id = 'ERROR'
    parsed.content = data.toString();
  }

  if (!streams[parsed.id]) {
    streams[parsed.id] = []
    io.sockets.emit('streams', Object.keys(streams))
  }

  let message = {
    timestamp: parsed.timestamp,
    streamid:  parsed.id,
    content:   parsed.content,
    type:      typeof parsed.content
  }

  // limit backlog to 100 lines
  streams[parsed.id].length >= 100 && streams[parsed.id].shift()
  debug("pushing message", message)
  streams[parsed.id].push(message)
  
  io.sockets.to(parsed.id).emit('line', message)
}

function handleData() {
  var buffer = '';
  return function(data) {
    var prev = 0, next;
    data = data.toString('utf8'); // assuming utf8 data...
    while ((next = data.indexOf('\n', prev)) > -1) {
      buffer += data.substring(prev, next);
  
      dataReceived(buffer);
      buffer = '';
      prev = next + 1;
    }
    buffer += data.substring(prev);
  }
}

var socket = net.createServer(function(socket) {
  socket.on('data', handleData());
});

/*!
 * socket.io
 */
io.on('connection', function (socket) {
  socket.emit('streams', Object.keys(streams))
  socket.on('select stream', function (stream) {
    Object.keys(socket.rooms).forEach(function(key) {
      socket.leave(socket.rooms[key])
    })
    if (!stream) return
    socket.join(stream)
    socket.emit('backlog', streams[stream])
  })
})

/*!
 * serve static webapp from S3
 */
if (!argv.webVersion) {
  app.use(serve(__dirname + '/../dist'))
} else if ('development' === argv.webVersion) {
  app.use('/app', serve(__dirname + '/../app'))
  app.use('/node_modules', serve(__dirname + '/../node_modules'))
  io.path('/app/socket.io')
} else {
  app.use(webapp({
    s3: 'http://rtail.s3-website-us-east-1.amazonaws.com/' + argv.webVersion,
    ttl: 1000 * 60 * 60 * 6 // 6H
  }))

  debug('serving webapp from: http://rtail.s3-website-us-east-1.amazonaws.com/%s', argv.webVersion)
}

/*!
 * listen!
 */
io.attach(http, { serveClient: false })
socket.listen(argv.tcpPort, argv.tcpHost);
http.listen(argv.webPort, argv.webHost)

debug('TCP  server listening: %s:%s', argv.tcpHost, argv.tcpPort)
debug('HTTP server listening: http://%s:%s', argv.webHost, argv.webPort)
