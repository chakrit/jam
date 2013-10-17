
// lib/jam.js - Main JAM entrypoint
module.exports = (function() {

  var assert = require('assert'), tick = null;

  // Find out if we have setImmediate and fallback to setTimeout if necessary.
  tick = typeof setImmediate === 'function' ?
    setImmediate :
    function(func) { setTimeout(func, 0); };

  // # INTERNAL HELPERS

  // Function and arguments helpers.
  var toArgs = function(args) { return Array.prototype.slice.call(args); };

  function replaceHead(args, newHead) {
    args = toArgs(args);
    if (!args.length) return [newHead];

    args[0] = newHead;
    return args;
  }

  function bind(func, context) {
    return function() { return func.apply(context, arguments); };
  }

  // Common assertions
  function ensureFunc(func, argName) {
    assert(typeof func === 'function', argName + ' argument missing or not a function');
  };

  function ensureNum(num, argName) {
    assert(typeof num === 'number', argName + ' argument missing or not a number');
  };

  function ensureArray(arr, argName) {
    assert(arr && typeof arr === 'object' && typeof arr.length === 'number',
      argName + ' argument missing or does not looks like an array');
  };

  // ---

  // # HELPERS

  // Additional functions that adds to the original jam function.
  function includeHelpers(func) {

    // ## jam.identity()

    // Simple function that passes the values it receives to the next function.
    // Useful if you need a `process.nextTick` inserted in-between your call chain.
    func.identity = function(next) {
      function _identity(next) {
        var args = arguments;
        tick(function() {
          next.apply(this, replaceHead(args, null));
        });
      }

      // This function can also be passed to jam verbatim.
      return (typeof next === 'function') ?
        _identity.apply(this, arguments) :
        _identity;
    };

    // ## jam.nextTick()

    // Alias for `.identity`. Use when you need a `process.nextTick` inserted in-between
    // your call chain.
    func.nextTick = func.identity

    // ## jam.return( [args...] )

    // Returns a set of values to the next function in the chain. Useful when you want to
    // pass in the next function verbatim without wrapping it in a `function() { }` just
    // to pass values into it.
    func.return = function() {
      var args = toArgs(arguments);
      return function(next) {
        args.unshift(null);
        next.apply(this, args);
      };
    };

    // ## jam.null()

    // Similar to `.identity` but absorbs all arguments that has been passed to it and
    // forward nothing to the next function. Effectively nullifying any arguments passed
    // from previous jam call.
    // 
    // Like `jam.identity`, this function can be passed to the jam chain verbatim.
    func.null = function(next) {
      function _null(next) { next(); }

      return (typeof next === 'function') ? _null.call(this, next) : _null;
    };

    // ## jam.call( function, [args...] )

    // Convenience for calling functions that accepts arguments in standard node.js
    // convention. Since jam insert `next` as first argument, most functions cannot be
    // passed directly into the jam chain, thus this helper function.
    // 
    // If no `args` is given, this function passes arguments given to `next()` call from
    // previous function directly to the function (with proper callback) placement).
    // 
    // Use this in combination with `jam.return` or `jam.null` if you want to control the
    // arguments that are passed to the function.
    func.call = function(func) {
      ensureFunc(func, 'function');

      var args = toArgs(arguments);
      args.shift(); // func

      if (args.length) { // use provided arguments
        return function(next) {
          args.push(next);
          func.apply(this, args);
        };

      } else { // use passed-in arguments during chain resolution
        return function(next) {
          args = toArgs(arguments);
          args.shift(); // move next to last position
          args.push(next);

          func.apply(this, args);
        };
      }
    };

    // ## jam.each( array, iterator( next, element, index ) )

    // Execute the given `iterator` function for each element given in the `array`. The
    // iterator is given a `next` function and the element to act on. The next step in the
    // chain will receive the original array passed verbatim so you can chain multiple
    // `.each` calls to act on the same array.
    // 
    // You can also pass `arguments` and `"strings"` as an array or you can omit the array
    // entirely, in which case this method will assume that the previous chain step
    // returns something that looks like an array as its first result.
    // 
    // Under the hood, a JAM step is added for each element. So the iterator will be
    // called serially, one after another finish. A parallel version maybe added in the
    // future.
    func.each = function(array, iterator) {
      if (typeof array === 'function') {
        iterator = array;
        array = null
      } else {
        ensureArray(array, 'array');
      }

      ensureFunc(iterator, 'iterator');

      return function(next, array_) {
        var arr = array || array_;

        // Builds another JAM chain internally
        var chain = jam(jam.identity)
          , count = arr.length;

        for (var i = 0; i < count; i++) (function(element, i) {
          chain = chain(function(next) { iterator(next, element, i); });
        })(arr[i], i);

        chain = chain(function(next) { next(null, arr); });
        return chain(next);
      };
    };

    // ## jam.map( array, iterator( next, element, index ) )

    // Works exactly like the `each` helper but if a value is passed to the iterator's
    // `next` function, it is collected into a new array which will be passed to the next
    // function in the JAM chain after `map`.
    // 
    // Like with `each`, you can omit the `array` input, in which case this method will
    // assume that the previous chain step returns something that looks like an array as
    // its first result.
    func.map = function(array, iterator) {
      if (typeof array === 'function') {
        iterator = array;
        array = null;
      } else {
        ensureArray(array, 'array');
      }

      ensureFunc(iterator, 'iterator');

      return function(next, array_) {
        var arr = array || array_;

        // Builds another JAM chain internally and collect results.
        // TODO: Dry with .each?
        var chain = jam(jam.identity)
          , count = arr.length
          , result = [];

        for (var i = 0; i < count; i++) (function(element, i) {
          chain = chain(function(next, previous) {
            result.push(previous);
            iterator(next, element, i);
          });
        })(arr[i], i);

        chain = chain(function(next, last) {
          result.push(last);
          result.shift(); // discard first undefined element
          next(null, result);
        });

        return chain(next);
      };
    };

    // ## jam.timeout( timeout )

    // Pauses the chain for the specified `timeout` using `setTimeout`. Useful for
    // inserting a delay in-between a long jam chain.
    func.timeout = function(timeout) {
      ensureNum(timeout, 'timeout');

      return function(next) {
        var args = replaceHead(arguments, null);
        setTimeout(function() { next.apply(this, args); }, timeout);
      };
    };

    // ## jam.promise( [chain] )

    // Returns a JAM promise, useful when you are starting an asynchronous call outside of
    // the JAM chain itself but wants the callback to call into the chain. In other words,
    // this allow you to put a 'waiting point' (aka promise?) into existing JAM chain that
    // waits for the initial call to finish and also pass any arguments passed to the
    // callback to the next step in the JAM chain as well.
    //
    // This function will returns a callback that automatically bridges into the JAM
    // chain. You can pass the returned callback to any asynchronous function and the JAM
    // chain (at the point of calling .promise()) will wait for that asynchronous function
    // to finish effectively creating a 'waiting point'.
    //
    // Additionally, any arguments passed to the callback are forwarded to the next call
    // in the JAM chain as well. If errors are passed, then it is fast-forwarded to the
    // last handler normally like normal JAM steps.
    func.promise = function(chain) {
      chain = typeof chain === 'function' ? chain : // chain is supplied
        typeof this === 'function' ? this : // called from the chain variable
        ensureFunc(chain, 'chain'); // fails

      if (typeof chain === 'undefined' && typeof this === 'function') {
        chain = this;
      }

      var args = null, next = null;

      chain(function(next_) {
        if (args) return next_.apply(this, args); // callback already called
        next = next_; // wait for callback
      });

      return function() {
        if (next) return next.apply(this, arguments); // chain promise already called
        args = arguments; // wait for chain to call the promise
      };
    };

    // TODO: noError() ? or absorbError()
    return func;
  };

  // ---

  // # JAM function

  // Exported function starts the asynchronous call chain.
  function jam(func, context) {
    ensureFunc(func, 'function');

    var steps = [];

    // ##### Chain resolver.

    // The resolver will execute all functions passed to the chain as soon as `nextTick`.
    // Thus jam will not works across async context where the chain is not built all at
    // once in a single event loop, which is not really a problem from my personal
    // experience.
    tick(function resolve(e) {
      var args = Array.prototype.slice.call(arguments);

      // Any errors passed to next() are (fast-)forwarded to the last function in the
      // chain skipping any functions that's left to be executed.
      if (e) return steps[steps.length - 1].apply(this, args);

      // Any parameters given to next() are passed as arguments to the next function in
      // the chain (except for errors, of course.)
      var next = steps.shift()
        , args = Array.prototype.slice.call(arguments)

      if (steps.length) {
        args.shift(); // error arg
        args.unshift(resolve); // next() function
      }

      return next.apply(this, args);
    });

    // ##### Chain context continuation.

    // Subsequent invocation of the function returned from the `jam` function simply adds
    // the given function to the chain.
    function continuable(func, context) {
      ensureFunc(func, 'function');

      if (context) { // TODO: Handle falsy things?
        func = bind(func, context);
      }

      steps.push(func);
      return continuable;
    };

    return includeHelpers(continuable(func, context));
  };

  // ---

  return includeHelpers(jam);

})();

