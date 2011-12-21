
// jam.js - Let's JAM!! X-D
(function(undefined) { 

  var JAM = function(firstFunc) {
    if (firstFunc === undefined) return;
    
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
      execTimeout = setTimeout(execOne, 0);
      return queueOne;
    };

    // alternate monadic ways to JAM
    queueOne.return = function(value) {
      return queueOne(function() { this(value); });
    };

    queueOne.do = function(action) {
      return queueOne(function() {
        action.apply(null, arguments);
        this.apply(null, arguments);
      });
    };

    queueOne.map = function(mapper) {
      return queueOne(function() { this(mapper.apply(null, arguments)); });
    };

    // kickoff the JAM chain
    execTimeout = setTimeout(execOne, 0);
    return queueOne;
  };

  // monad identity function
  JAM.id = function() { this(); };

  // wire queueOne utility methods into the JAM objects
  // so it also works on first jam() invocation
  // i.e. JAM.return() 
  var utils = ['return', 'do', 'map'];
  for (var i in utils) (function(util) {
    JAM[util] = function() {
      return JAM(JAM.id)[util].apply(null, arguments);
    };
  })(utils[i]);


  module.exports = JAM;

})();
