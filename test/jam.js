
// test/jam.js - Test the main JAM exports
(function() {

  var assert = require('chai').assert
    , stub = require('sinon').stub;

  function agent() {
    return stub().callsArg(0);
  }

  describe('JAM module', function() {
    before(function() { this.jam = require('../index'); });

    it('should exports a function', function() {
      assert.typeOf(this.jam, 'function');
    });
  });

  describe('JAM function', function() {
    before(function() { this.jam = require('../index'); });

    it('should runs the supplied function', function(done) {
      this.jam(done);
    });

    it('should returns a function', function(done) {
      assert.typeOf(this.jam(done), 'function');
    });

    it('should supply a `next` function when chaining', function(done) {
      this.jam(function(next) {
        assert.typeOf(next, 'function');
        next();
      })(done);
    });

    it('should *not* supply `next` for the last entry in the chain', function(done) {
      this.jam(agent())(function(arg) {
        assert.isUndefined(arg);
        done();
      });
    });

    it('should runs all the supplied functions if chained', function(done) {
      var raccoon = agent(), rabbit = agent(), horse = agent();
      this.jam(raccoon)(rabbit)(horse)(function() {
        assert(raccoon.called);
        assert(rabbit.called);
        assert(horse.called);
        done();
      });
    });
  });

})();

