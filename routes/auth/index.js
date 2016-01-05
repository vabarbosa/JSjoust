function register (server, options, next) {

  require("./routes.js")(server);

  next();
}

var attributes = require("./package.json");

exports.register = register;
exports.register.attributes = attributes;
