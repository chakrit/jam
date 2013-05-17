
// test/jam.js - Test the main JAM exports
(function() {

  var assert = require('chai').assert
    , stub = require('sinon').stub;


  var NON_FUNCTIONS = [undefined, null, 123, 'string'];

  function agent() { return stub().callsArg(0); }
  function ident(next) { if (typeof next === 'function') return next(); }


  describe('JAM', function() {
    before(function() { this.jam = require('../index'); });

    describe('module', function() {
      it('should exports a function', function() {
        assert.typeOf(this.jam, 'function');
      });
    }); // module

    describe('function', function() {
      it('should throws if given something that is not a function', function() {
        var me = this;
        NON_FUNCTIONS.forEach(function(thing) {
          assert.throws(function() { me.jam(thing); }, /function/i);
        });
      });

      it('should throws if given something as a chain continuation that is not a function', function() {
        var me = this;
        NON_FUNCTIONS.forEach(function(thing) {
          assert.throws(function() { me.jam(ident)(thing); }, /function/i);
        });
      });

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

      it('should not pass error to the last function in the chain if arguments were given to last `next` call', function(done) {
        this.jam(function(next) { next(null, 'one', 'two', 'three'); })
          (function(e) {
            // 'one' may accidentally be passed due to an arguments shifting bug
            assert.ok(!e);
            done();
          });
      });

      it('should pass error to the last function in the chain if error is given to `next`', function(done) {
        var e = new Error('test');

        this.jam(function(next) { next(e); })
          (function(next) { done(new Error('This function should *not* run.')); })
          (function(e_) {
            assert.equal(e, e_);
            done();
          });
      });

      it('should pass arguments to chained function if non-error arguments given to `next`', function(done) {
        this.jam(function(next) { next(null, 'one'); })
          (function(next, arg) { assert.equal(arg, 'one'); next(); })
          (function(next) { next(null, 'two', 'three'); })
          (function(next, arg0, arg1) {
            assert.equal(arg0, 'two');
            assert.equal(arg1, 'three');
            next();
          })
          (done);
      });

      it('should calls initial function with `this` bound to supplied context object', function(done) {
        this.jam(function(next) {
          assert.equal(this, assert);
          next()
        }, assert)(done);
      });

      it('should calls chained function with `this` bound to supplied context object', function(done) {
        this.jam(function(next) { next(); })
          (function(next) { assert.equal(this, assert); next() }, assert)
          (done);
      });

    }); // function

  });

})();

