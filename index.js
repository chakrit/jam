
// index.js - Main application entrypoint
module.exports = process.env.COVER ?
  require('./lib-cov/jam') :
  require('./lib/jam');

