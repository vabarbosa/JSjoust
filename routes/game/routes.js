// Do authentication etc
var Pusher  = require('pusher');
var request = require('request');

var pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  encrypted: true,
});
pusher.port = 443;

module.exports = function (server) {

  server.route({
      method: ['GET', 'POST'], // Must handle both GET and POST
      path: '/game',          // The callback endpoint registered with the provider
      config: {
        auth: 'jsjoust-cookie',
        handler: (req, reply) => {
          reply.view('Game', {
            username: req.auth.credentials.username,
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
      method: ['GET', 'POST'], // Must handle both GET and POST
      path: '/gameover/{gamedb}',          // The callback endpoint registered with the provider
      config: {
        auth: 'jsjoust-cookie',
        handler: function (request, reply) {
          reply.view('GameOver', {
            gamedb: request.params.gamedb,
          });

        },
      },
    });

  server.route({
      method: ['GET'], // Must handle both GET and POST
      path: '/leaderboard',          // The callback endpoint registered with the provider
      config: {
        auth: 'jsjoust-cookie',
        handler: (request, reply) => {

          reply.view('Game', {
          });

        },
      },
    });

};
