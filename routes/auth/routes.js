// Do authentication etc

module.exports = function(server) {

  server.route({
        method: ['GET', 'POST'], // Must handle both GET and POST
        path: '/login',          // The callback endpoint registered with the provider
        config: {
            auth: 'twitter',
            handler: (request, reply) => {

                if (!request.auth.isAuthenticated) {
                    return reply('Authentication failed due to: ' + request.auth.error.message);
                }

                var account = {
                  id: request.auth.credentials.profile.id,
                  username: request.auth.credentials.profile.username,
                  displayName: request.auth.credentials.profile.displayName,
                  email: request.auth.credentials.profile.email
                }

                request.auth.session.set(request.auth.credentials.profile);

                return reply.redirect('/dashboard').state('jsjoust-cookie', account);
            }
        }
    });
  server.route({
      method: 'GET',
      path: '/logout',
      config: {
          handler: (request, reply) => {
              // Clear the cookie
              request.auth.session.clear();

              return reply.redirect('/');
          }
      }
  });

}
