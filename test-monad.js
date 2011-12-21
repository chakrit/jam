
// test-monad.js - Test monadic helper functions
(function() {

  require('./jam')
    .return(['h', 'e', 'l', 'l', 'o', ' ', '!'])
    .map(function(arr) {
      var str = "";
      for (var i in arr) str += arr[i];
      return str;
    })
    .do(console.log);

})();
