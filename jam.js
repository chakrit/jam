
// jam.js - Let's JAM!! X-D
(function(undefined) { 

  var JAM = function(firstFunc) {
    var queue = [firstFunc]
      , execTimeout;
    
    // continuation iterator, core continuation engine
    var execOne = function() {
      if (queue.length === 0) return;

      // call the next function in queue with
      // `this` set to this very function
      queue.shift().apply(execOne, arguments);
    };

    // jam function queue processor
    var queueOne = function(next) {
      queue.push(next);

      // delay kickoff until user finished adding functions.
      clearTimeout(execTimeout);
      setTimeout(execOne, 0);
      return queueOne;
    };

    execTimeout = setTimeout(execOne, 0);
    return queueOne;
  };

  module.exports = JAM;

})();
