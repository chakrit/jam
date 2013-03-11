
// index.js - Main application entrypoint
module.exports = process.env.JAM_COVER ?
  require('./lib-cov/jam') :
  require('./lib/jam');

