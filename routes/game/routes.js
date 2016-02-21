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

// limit=20&reduce=true&inclusive_end=true&start_key=%5B%22ukmadlz%22%2C%22gamedb_1456021545385%22%5D&end_key=%5B%22ukmadlz%22%2C%22gamedb_1456021545385%22%5D&group=true
          leaderDB.view('leaderboard', 'scorecheck', {
            start_key: [request.params.twitter, request.params.gameDB],
            end_key: [request.params.twitter, request.params.gameDB],
            group: true,
            group_level: 1,
            reduce: true,
            inclusive_end: true,
          }, function (err, data) {
            if (err) console.log(err);
            if (true) {
              leaderDB.insert({
                twitter: request.params.twitter,
                game: request.params.gameDB,
                timestamp: Date.now(),
              }, function (err, body) {
                if (!err)
                  console.log('insert', body);
              });
            }

            reply({
              gameDb: request.params.gameDB,
              winner: request.params.twitter,
            });
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

};
