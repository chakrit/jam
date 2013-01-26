
// lib/jam.js - Main JAM entrypoint
module.exports = (function() {

  var tick = process.nextTick;

  function jam(func) {
    var steps = [];

    tick(function resolve() {
      steps.shift()(steps.length ? resolve : undefined);
    });

    function context(func) {
      steps.push(func);
      return context;
    };

    return context(func);
  };

  return jam;

})();

