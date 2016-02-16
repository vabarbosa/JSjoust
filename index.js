'use strict';

// Config
require('dotenv').load({ silent: true });

// Libs
var Hapi           = require('hapi');
var Path           = require('path');
var Bell           = require('bell');
var Inert          = require('inert');
var Vision         = require('vision');
var Yar            = require('yar');
var HapiAuthCookie = require('hapi-auth-cookie');
var dateFormat     = require('dateformat');

// format
var format = 'd mmm HH:MM:ss';

// Instantiate the server
var server = new Hapi.Server({
  debug: {
    request: ['error', 'good'],
  },
  connections: {
    routes: {
      files: {
        relativeTo: Path.join(__dirname, 'public'),
      },
    },
  },
});

// Set Hapi Connections
server.connection({
  // host: process.env.VCAP_APP_HOST || 'localhost',
  port: process.env.VCAP_APP_PORT || process.env.PORT || 3000,
});

// Hapi Log
server.log(['error', 'database', 'read']);

// Hapi Plugins
var hapiErr = function (err) {
  if (err) console.log(err);
};

server.register(Inert, hapiErr);
server.register(Vision, hapiErr);
server.register({
  register: Yar,
  options: {
    storeBlank: false,
    cookieOptions: {
      password: 'cookie_encryption_password',
      isSecure: false,
    },
  },
}, hapiErr);

// Templating
server.views({
  engines: { jade: require('jade') },
  path: Path.join(__dirname, 'views'),
  compileOptions: {
    pretty: true,
  },
});

// Auth
server.register(Bell, hapiErr);
server.register(HapiAuthCookie, hapiErr);
server.auth.strategy('jsjoust-cookie', 'cookie', {
  cookie: 'jsjoust-cookie',
  password: 'cookie_encryption_password',
  isSecure: process.env.HTTPS || true,
});
server.auth.strategy('twitter', 'bell', {
  provider: 'twitter',
  password: 'cookie_encryption_password',
  clientId: process.env.TWITTER_ID,
  clientSecret: process.env.TWITTER_SECRET,
  isSecure: process.env.HTTPS || true,
});
server.register(require('./routes/auth'), hapiErr);

// Index
server.route({
  method: 'GET',
  path: '/',
  config: {
    auth: {
      mode: 'try',
      strategy: 'jsjoust-cookie',
    },
    plugins: {
      'hapi-auth-cookie': {
        redirectTo: false,
      },
    },
    handler: (request, reply) => {
      reply.view('Index', {
        title: 'Start | Hapi ' + request.server.version,
        message: 'Yo Bro!',
      });
    },
  },
});

// Routes
server.register(require('./routes/game'), hapiErr);

// Static files
server.route({
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {
      path: '.',
      redirectToSlash: true,
      index: true,
    },
  },
});

// Start Hapi
server.start(function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log(dateFormat(new Date(), format) + ' - Server started at: ' + server.info.uri);
  }
});
