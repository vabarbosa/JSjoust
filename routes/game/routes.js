// Do authentication etc

module.exports = function (server) {

  server.route({
      method: ['GET', 'POST'], // Must handle both GET and POST
      path: '/game',          // The callback endpoint registered with the provider
      config: {
        auth: 'jsjoust-cookie',
        handler: (request, reply) => {

          reply.view('Game', {
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
