// Do authentication etc
var Pusher  = require('pusher');
var request = require('request');
var Cloudant = require('cloudant');

// Pusher
var pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  encrypted: true,
});
pusher.port = 443;

// Cloudant
var vcapServices = JSON.parse(process.env.VCAP_SERVICES);

// Setup Cloudant
var cloudantCreds = vcapServices.cloudantNoSQLDB[0].credentials;
var cloudant = Cloudant({
  account: cloudantCreds.username,
  password: cloudantCreds.password,
});

module.exports = function (server) {

  server.route({
      method: ['GET', 'POST'], // Must handle both GET and POST
      path: '/game',          // The callback endpoint registered with the provider
      config: {
        auth: 'jsjoust-cookie',
        handler: (req, reply) => {
          reply.view('Game', {
            title: 'Game On!',
            username: req.auth.credentials.username,
            appname: process.env.APPNAME,
          });

        },
      },
    });

  server.route({
      method: ['GET', 'POST'], // Must handle both GET and POST
      path: '/join',          // The callback endpoint registered with the provider
      config: {
        auth: 'jsjoust-cookie',
        handler: function (req, reply) {

          var gameDB = 'gamedb_' + Date.now();

          request.get('/keygen?user=' + gameDB, function (err, response, body) {

            pusher.trigger('jsjoust-channel', 'join', {
              gameDb: gameDB,
            });

            reply({
              gameDb: gameDB,
            });

          });

        },
      },
    });

  server.route({
      method: ['GET', 'POST'], // Must handle both GET and POST
      path: '/start/{gamedb}',          // The callback endpoint registered with the provider
      config: {
        auth: 'jsjoust-cookie',
        handler: function (request, reply) {

          pusher.trigger('jsjoust-channel', 'start-' + request.params.gamedb, {
            start: (new Date).toISOString(),
          });

          reply({
            gameDb: request.params.gamedb,
          });

        },
      },
    });

  server.route({
      method: ['GET'], // Must handle both GET and POST
      path: '/gameover/{gamedb}',          // The callback endpoint registered with the provider
      config: {
        auth: 'jsjoust-cookie',
        handler: function (request, reply) {
          reply.view('GameOver', {
            title: 'Game Over',
            gamedb: request.params.gamedb,
            appname: process.env.APPNAME,
          });

        },
      },
    });

  server.route({
      method: ['POST'], // Must handle both GET and POST
      path: '/gameover/{gamedb}',          // The callback endpoint registered with the provider
      config: {
        auth: 'jsjoust-cookie',
        handler: function (request, reply) {

          pusher.trigger('jsjoust-channel', 'end-' + request.params.gamedb, {
            end: (new Date).toISOString(),
          });

          reply({
            gameDb: request.params.gamedb,
          });

        },
      },
    });

  server.route({
      method: ['GET', 'POST'], // Must handle both GET and POST
      path: '/leaderboard/{twitter}/{gameDB}',          // The callback endpoint registered with the provider
      config: {
        auth: 'jsjoust-cookie',
        handler: (request, reply) => {
          var leaderDB = cloudant.use('leaderboard');
          leaderDB.insert({
            twitter: request.params.twitter,
            game: request.params.gameDB,
            timestamp: Date.now(),
          },
          request.params.twitter + '__' + request.params.gameDB,
          function (err, body) {
            if (!err)
              console.log('insert', body);
          });

          reply({
            gameDb: request.params.gameDB,
            winner: request.params.twitter,
          });
        },
      },
    });

  server.route({
      method: ['GET'], // Must handle both GET and POST
      path: '/leaderboard',          // The callback endpoint registered with the provider
      handler: (request, reply) => {
        reply.view('Leaderboard', {
          title: 'Leaderboard',
          appname: process.env.APPNAME,
        });
      },
    });

  var controllerPage = function (request, reply) {
    var gameDB = request.params.gamedb || false;
    reply.view('Controller', {
        title: 'Controller',
        gamedb: gameDB,
        appname: process.env.APPNAME,
      });

  };

  server.route({
      method: ['GET'], // Must handle both GET and POST
      path: '/controller',          // The callback endpoint registered with the provider
      config: {
        auth: 'jsjoust-cookie',
        handler: controllerPage,
      },
    });

  server.route({
      method: ['GET'], // Must handle both GET and POST
      path: '/controller/{gamedb}',          // The callback endpoint registered with the provider
      config: {
        auth: 'jsjoust-cookie',
        handler: controllerPage,
      },
    });

};
