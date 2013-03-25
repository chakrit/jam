
// test/helpers.js - Test JAM helper functions
(function() {

  var assert = require('chai').assert
    , stub = require('sinon').stub;

  var NON_FUNCTIONS = [undefined, null, 123, 'string', { }, []]
    , NON_ARRAYS = [undefined, null, 123, 'string', { }, function() { }]
    , NON_NUMS = [undefined, null, 'string', { }, function() { }, []];


  // functions with multiple usage modes
  describeModes = function(modes, tests) {
    for (var mode in modes) (function(mode, code) {
      describe(mode, function() {
        before(function() {
          this.factory = new Function('return ' + code + ';')
        });

        after(function() { delete this.factory; });

        tests()
      });
    })(mode, modes[mode]);
  };


  describe('Helpers', function() {
    before(function() { this.jam = require('../index'); });

    describe('.identity function', function() {
      describe('.nextTick alias', function() {
        it('should be exported', function() {
          assert.typeOf(this.jam.nextTick, 'function');
          assert.equal(this.jam.nextTick, this.jam.identity);
        });
      });

      it('should be exported', function() {
        assert.typeOf(this.jam.identity, 'function');
      });

      var MODES =
        { 'normal form'  : 'this.jam.identity'
        , 'invoked form' : 'this.jam.identity()' };

      describeModes(MODES, function() {
        it('should calls the next function without any args when used standalone', function(done) {
          this.jam(this.factory())
            (function(next) { assert.lengthOf(arguments, 1); next(); })
            (done);
        });

        it('should pass all the args to the next function when used in chain', function(done) {
          this.jam(function(next) { next(null, 'one', 'two'); })
            (this.factory())
            (function(next, arg0, arg1) {
              assert.equal(arg0, 'one');
              assert.equal(arg1, 'two');
              next();
            })
            (done);
        });
      });

    }); // .identity

    describe('.return function', function() {
      it('should be exported', function() {
        assert.typeOf(this.jam.return, 'function');
      });

      it('should calls the next function with the supplied values', function(done) {
        this.jam(this.jam.return('one', 'two'))
          (function(next, arg0, arg1) {
            assert.equal(arg0, 'one');
            assert.equal(arg1, 'two');
            next();
          })
          (done);
      });
    }); // .return

    describe('.null function', function() {
      it('should be exported', function() {
        assert.typeOf(this.jam.null, 'function');
      });

      var MODES =
        { 'normal form'  : 'this.jam.null'
        , 'invoked form' : 'this.jam.null()' };

      describeModes(MODES, function() {
        it('should calls the next function in the chain with no arguments', function(done) {
          this.jam(function(next) { next(null, 1, 2, 3); })
            (this.factory())
            (function(next, arg) {
              assert.isUndefined(arg);
              next();
            })
            (done);
        });
      });
    }); // .null

    describe('.call function', function() {
      it('should be exported', function() {
        assert.typeOf(this.jam.call, 'function');
      });

      it('should throws if function argument missing or not a function', function() {
        var me = this;

        NON_FUNCTIONS.forEach(function(thing) {
          assert.throws(function() { me.jam.call(thing); }, /func/i);
        });
      });

      it('should calls the given function when no arguments given', function(done) {
        var spy = stub().callsArg(0);
        this.jam(this.jam.call(spy))
          (function(next) { assert(spy.called); next(); })
          (done);
      });

      it('should passes arguments to the function if arguments given', function(done) {
        var spy = stub().callsArg(1);
        this.jam(this.jam.call(spy, 'one'))
          (function(next) { assert(spy.calledWith('one')); next(); })
          (done);
      });

      it('should forwards arguments to `next()` from previous function if no arguments given', function(done) {
        var spy = stub().callsArg(2);

        this.jam(function(next) { next(null, 'one', 'two'); })
          (this.jam.call(spy))
          (function(next) { assert(spy.calledWith('one', 'two')); next(); })
          (done);
      });
    }); // .call

    describe('.map function', function() {
      it('should be exported', function() {
        assert.typeOf(this.jam.map, 'function');
      });

      it('should throws if array argument missing or not an array', function() {
        var me = this;
        NON_ARRAYS.forEach(function(thing) {
          assert.throws(function() { me.jam.map(thing); }, /array/i);
        });
      });

      it('should throws if iterator argument missing or not a function', function() {
        var me = this;
        NON_FUNCTIONS.forEach(function(thing) {
          assert.throws(function() { me.jam.map([1,2,3], thing); }, /iterator/i);
        });
      });

      it('should calls iterator for each element in the given array serially', function(done) {
        var elements = ['one', 'two', 'three']
          , index = 0;

        this.jam(this.jam.map(elements, function(next, element, index_) {
          assert.equal(index_, index);
          assert.equal(element, elements[index]);
          index++;
          next();
        }))(done);
      });

      it('should forwards error properly when an iterator calls `next()` with an Error`', function(done) {
        var err = new Error('test error')
          , elements = ['one', 'two', 'three']
          , index = 0;

        this.jam(this.jam.map(elements, function(next, element, index_) {
          next((index_ < 2) ? undefined : err); // throw on last element

        }))(function(e) {
          assert.equal(e, err); // should be forwarded here
          done();
        });
      });
    }); // .map

    describe('.timeout function', function() {
      it('should be exported', function() {
        assert.typeOf(this.jam.timeout, 'function');
      });

      it('should throws if timeout argument missing or not a number', function() {
        var me = this;

        NON_NUMS.forEach(function(thing) {
          assert.throws(function() { me.jam.timeout(thing); }, /timeout/i);
        });
      });

      it('should calls the next function after the specified timeout', function(done) {
        this.jam(this.jam.timeout(1))(done);
      });

      it('should forwards arguments to `next()` from previous function', function(done) {
        this.jam(this.jam.return('hello'))
          (this.jam.timeout(1))
          (function(e, hello) {
            assert(hello === 'hello');
            done()
          });
      });
    });

  });

})();
