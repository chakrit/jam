
var FILES = 'file1.txt,file2.txt,file3.txt'.split(',')
  , jam = require('../lib/jam')
  , fs = require('fs');

// normal form
var readFile = function(next, filename) { fs.readFile(filename, next); }
  , catResult = function(next, result) {
    process.stdout.write(result.join(''));
    next();
  };

function normal(next) {
  console.log("NORMAL FORM ::");
  jam(jam.map(FILES, readFile))
    (catResult)
    (next);
}

function monad(next) {
  console.log("MONAD FORM ::");
  jam(jam.return(FILES))
    (jam.map(readFile))
    (catResult)
    (next);
}

jam(normal)(monad)(function(e) { if (e) console.error(e); });

