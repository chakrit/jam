
// test-multi.js - Test multiple nested JAMs
(function() {

  var jam = require('../index')
    , util = require('util');
  
  jam(function() {
    jam(function() {
      jam(function() { util.log("JAM! ONE"); this(); }) 
        (function() { util.log("JAM! TWO"); this(); })
        (function() { util.log("JAM! THREE"); setTimeout(this, 300); })
        (this);
    })
    (function() { util.log("JAM! FOUR"); this(); })
    (function() { util.log("JAM! FIVE"); this(); });
  });

})();
