
// lib/jam.js - Main JAM entrypoint
module.exports = (function() {

  var tick = process.nextTick;

  // helper for exported jam functions
  function augment(func) {

    // utility functions
    func.identity = function(next) { next(); };

    // common transformers
    func.map = func.identity; // TODO

    return func;
  };

  // main jam constructor
  function jam(func) {
    var steps = [];

    // async resolver
    tick(function resolve() {
      steps.shift()(steps.length ? resolve : undefined);
    });

    // jam chaining context
    function context(func) {
      steps.push(func);
      return context;
    };

    return augment(context(func));
  };

  return augment(jam);

})();

