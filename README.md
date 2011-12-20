JAM
---

JAM it together like `this`:

    jam(function() { doYourThing(); this(); })
      (function() { doOtherThingWithCallback(this); })
      (function() { doOtherThingWithCallbackArgs(this); })
      (function(result) { doNodeJsStuff(this); })
      (function(err, result) { setTimeout(this, 3000); })
      (function() { /* yay! we're done! */ });

That is, the `this` object is the next function to be called. Use `this` when you need to pass a callback.

You can even nest `JAM`s inside each other:

    jam(function() { jam(function() { jam(function() { ....

And the JAM chain would still execute correctly :)
