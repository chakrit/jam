
// test/jam.js - Test the main JAM exports
(function() {

  var assert = require('chai').assert
    , stub = require('sinon').stub;

  function agent() {
    return stub().callsArg(0);
  }

  describe('JAM', function() {
    before(function() { this.jam = require('../index'); });

    describe('module', function() {
      it('should exports a function', function() {
        assert.typeOf(this.jam, 'function');
      });
    }); // module

    describe('function', function() {
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
    }); // function

    describe('utility functions', function() {
      describe('.identity', function() {
        it('should be exported', function() {
          assert.typeOf(this.jam.identity, 'function');
        });

        it('should calls the next function without any args', function(done) {
          this.jam.identity(function() {
            assert.lengthOf(arguments, 0);
            done();
          });
        });

        it('should works when used in chain', function(done) {
          this.jam(this.jam.identity)(done);
        });
      });
    }); // utility functions

    describe.skip('helper', function() {
      describe('.map', function() {
        it('should be exported', function() {
          assert.typeOf(this.jam.map, 'function');
        });

        it('should calls iterator for each element in array', function(done) {
          var items = [1, 2, 3]
            , counter = 1;

          //this.jam.map(items,
        });
      });
    }); // helpers

  });

})();

