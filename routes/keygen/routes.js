var Cloudant = require('cloudant');

// VCAP Services
var vcapServices = JSON.parse(process.env.VCAP_SERVICES);

// Setup Cloudant
var cloudantCreds = vcapServices.cloudantNoSQLDB[0].credentials;
var cloudant = Cloudant({
  account: cloudantCreds.username,
  password: cloudantCreds.password,
});

// Error return
var errorFunc = function (error, callback) {
  callback({
    error: error.message,
  }).code(error.statusCode);
};

// Process security
var processSecurity = function (database, api, reply) {
  var db = cloudant.db.use(database);

  // Or you can read the security settings from a database.
  db.get_security(function (er, result) {
    if (er) {
      errorFunc(er, reply);
    } else {
      var security = (result.cloudant) ? result.cloudant : {};
      security[api.key] = ['_reader', '_writer', '_replicator'];

      db.set_security (security, function (er, result) {
        if (er) {
          errorFunc(er, reply);
        } else {
          var url = 'https://' +
          api.key +
          ':' +
          api.password +
          '@' +
          cloudantCreds.host +
          '/' +
          database;
          reply({
            url: url,
          }).code(200);
        }
      });
    }
  });
};

module.exports = function (server) {

  // Route to return the url to access a Cloudant DB
  server.route({
    method: ['GET', 'POST'], // Must handle both GET and POST
    path: '/keygen',          // The callback endpoint registered with the provider
    handler: (request, reply) => {
      cloudant.generate_api_key(function (er, api) {
        if (er) {
          throw er; // You probably want wiser behavior than this.
        };

        if (process.env.DBPERUSER) {
          database = (request.params.user) ? request.params.user :
            ((request.query.user) ? request.query.user : api.key);
          cloudant.db.get(database, function (err, body) {
            if (err) {
              cloudant.db.create(database, function (err, body) {
                if (err) {
                  errorFunc(err, reply);
                } else {
                  processSecurity(database, api, reply);
                }
              });
            } else {
              processSecurity(database, api, reply);
            }
          });
        } else {
          processSecurity(database, api, reply);
        }
      });
    },
  });

};
