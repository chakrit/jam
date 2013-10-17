
var FILES = 'file1.txt,file2.txt,file3.txt'.split(',')
  , jam = require('../lib/jam')
  , fs = require('fs');

var chain = jam(jam.identity);

FILES.forEach(function(filename) {
  fs.readFile(filename, chain.promise());

  chain(function(next, result) {
    console.log("FILE: " + filename);
    console.log(result.toString());
    next();
  });
});

chain(function(e) {
  console.log("DONE.");
});

