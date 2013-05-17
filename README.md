[![Build Status](https://travis-ci.org/chakrit/jam.png?branch=master)](https://travis-ci.org/chakrit/jam)

# JAM JAM JAM

```sh
$ npm install jam --save
```

JAM is another kind of async framework that tries to have as minimum boilerplate code as
possible with sensible defaults. (Or as sensible as I can make it; PR and ideas welcome.)

JAM wants you to get right in to building your `async` chain as soon as possible.

JAM also aims to bundle with itself some "combinators" (or just "helpers") which helps you
manipulate arguments and functions that are being passed around in the chain with ease.
There is only a handful of them right now, but I will add more whenever I see a good use
for one.

# HOW TO

JAM functions must accept a `next` argument first thing which you should call as soon as
your asynchronous processing is done:

Let's start with the simplest possible invocation of jam:

```js
var chain = jam( function(next) { next(); } );
```

**JAM will starts executing your chain as soon as `nextTick`.** So, in the event loop time
you have been allocated, you can add as many methods as you like and the chain will start
executing as soon your loop finishes. No more steps necessary!

You may think that this poses a problem but I find that most (if not all) of the cases
where you want to do multiple asynchronous calls, you will build all your calls in a
single run loop. So this is a non-issue.

To add a method to the chain, simply invoke the result from the last JAM invocation as a
function like this:

```js
chain = chain( function secondStep(next) { next(); } );
```

JAM expects most asynchronous method calls to be executed serially so that is what the
chain does by default when you start adding methods to the chain.

Since JAM return values are just functions, you don't even need to hold it in a variable
if you like extra brevity of code:

```js
jam( function firstStep(next)  { next(); } )
  (  function secondStep(next) { next(); } )
  (  function lastStep()       { } );
```

JAM also handles `Error`s for you. Note:

* The convention here is that the last function in the chain is often the one that will
  handle all errors in the chain.
* The last function does not need any more `next()` since it's the last one.

JAM convention utilizes the two facts above to pass any `Error` that happens in the chain
to the last function as first argument.

So if you need error handling, write the last function as a standard node.js callback:

```js
jam(function erroneous(next) {
    next(new Error('naw!');
  })
  (function handler(err) {
    if (err) { console.log(err.stack); }
  });
```

Additionally, JAM also passes anything else given to the `next()` function to the next one
as arguments as well so you can do this:

```js
jam(function(next) { fs.readFile('filename.txt', next); })
  (function(next, data) {
    console.log("FILE DATA:\r\n" + data);
  });
```

This is much better than if JAM put `next()` as the last argument since some functions
calls your `callback` with more arguments than you need (or aware of) thus making your
code dependent on the number of arguments given.

Passing `next` as first argument eliminates the dependency since you can bind as many
arguments as you want and the `next()` is still passed as first argument always.

Since this pattern allows you to pass functions verbatim, JAM also helps you binds the
funciton context as well if you supply the context object as the second argument:

```js
var myObj =
  { text: 'HELLO'
  , echo: function() { console.log(this.text); }
  };

jam(myObj.echo, myObj); // executes myObj.echo with this === myObj
```

Additionally, there are helpers available that lets you build JAM chains more easily.

# HELPERS

This is just a quick list to give you some ideas. More documentation on helpers are
available with with the [annotated source of jam.js](http://gh.chakrit.net/jam/).

Or feel free to ping me [@chakrit](http://twitter.com/chakrit) on Twitter or open a GH
issue for questions.

#### identity( )

```js
jam(function first(next) { next('one'); })
  (jam.identity)
  (function second(err, arg) {
    assert(arg === 'one'); // passese
  });
```

Passes arguments it receives to the next function in the chain without any modification.
Also useful as a starting point when building a complex jam chain (i.e. in a for loops
that re-uses the jam return values.)

See `nextTick()` below.

#### nextTick( )

```js
jam( function firstStep(next) { next(); } )
  ( jam.nextTick )
  ( function badSecondStep(next) { next(); } );
```

Except for the first invocation, JAM chains are executed synchronously one after another
as soon as you call `next()`. This may pose a problem for some code that does not expect
asynchronous functions to execute immeditaely.

This function fixes this case by inserting a nextTick() in-between the call chain to make
sure it executes on `process.nextTick`.

This function is actually just an alias for `.identity`

#### return( [args...] )

```js
function handleFileContent(e, file) {
};

// parallel handleFileContent jam
['file1.txt', 'file2.txt', 'file3.txt'].forEach(function(file) {
  jam(jam.return(file))
    (jam.call(fs.readFile)) // no function() needed!
    (handleFileContent);
});
```

This allows you to provide arguments to the next function in the chain (or for starting
it) without modifying or wrapping code for the rest of the chains.

#### call( func, [args...] )

```js
jam(jam.call(findTheRightFile))
  (jam.call(fs.readFile))
  (function(e, fileContent) {
    // fileContent is the content of the right file
  });
```

This helper lets you call standard node.js functions that expect callbacks at the end.
Additionally, any arguments that would normally be given to the chain function would be
used to call the function instead (`next()` is then added at the end of the arguments
list).

#### map( array, iterator( next, element, index ) )

```js
var FILES = 'file1.txt,file2.txt,file3.txt'.split(',')
  , cat = '';

jam(jam.map(FILES, function(next, file) {
  fs.readFile(file, function(e, fileContent) {
    cat += fileContent
    next();
  });

})(function(e) { console.log(cat); });
```

Runs the `iterator` for each element in the array. The `iterator` is given its own version
of `next()` and the element to process.

Internally a new JAM chain is built and a chain step is added for each element.

# LICENSE

BSD

# SUPPORT / CONTRIBUTE

Pull requests and/or ideas welcome.

Please open a [new GitHub Issue](https://github.com/chakrit/jam/issues/new) for any bugs
you find or if you just had a question.

#### TODOs

* Binded calls. Something like `jam.method(object, 'func')` that works like `jam.call`.
* Nullify calls, in case you don't want any arguments passed.
* Parellel map() ?

# WHY ?

Short answer: Because the existing ones are so cumbersome to use that I just had enough
with it.

Yeah, I know there're tons of other continuation helpers out there already but there
really isn't one where you could quickly just type-in the list of stuff to do and be done
with it without worrying about forgetting to close the list with that final parenthesis or
forgetting to add a comma. And yeah, IMO it is wayyy easier to just add a
`(function() { })` block at the end because that's what you're usually doing all the time
anyway taking care of all those JS variable scopes. Plus it is easier to
copy/paste/reorder the steps as well.

Another thing is that most of the libraries try to provide you with a lot of powerful way
to run asynchronous functions where most of the time you just want to reduce the amount of
nesting in your code.

So my idea is that the interface should be really minimal using the most common case with
sane defaults and then provide helpers for bringing edge cases into this minimal interface
neatly so you can just get your stuff done without worrying about wether you are using the
right async call or if you have the right number of arguments.

So I decided, WTH, I had enough and I could just write one.

And you gotta admit, writing all these stuff is just god damned *fun*! XD

