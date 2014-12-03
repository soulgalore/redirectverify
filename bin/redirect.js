#!/usr/bin/env node

function help() {
  console.log('Batch verify that a redirect ends up on the right URL.');
  console.log('You need to supply a file with the format of path;endpath<EOL>path2;endpath2<EOL>');
  console.log('And a starturl that will be added to the path');
  console.log(' --file the file with the pathes to test');
  console.log(' --starturl the start url that will be added to each path, example http://www.example.com');
  console.log(' --parallel how many urls to test in parallel. By default it is 1 at each time.');
  console.log(' --help this help text');
}

var VerifyRedirect = require('../lib/redirect'),
  argv = require('minimist')(process.argv.slice(2),
  {
    alias: {
      'f': 'file',
      's': 'starturl',
      'p': 'parallel',
      'h': 'help'
    }
  }
  );

  if (argv.help) {
    help();
    process.exit(0);
  }

  if (!argv.starturl) {
    console.error('Missing starturl parameter. Supply a starturl in the format of http://www.example.com');
    help();
    process.exit(255);
  }

  if (!argv.file) {
    console.error('Missing file parameter. Supply the path to the file that contains the redirect paths that will be tested');
    help();
    process.exit(255);
  }

var r = new VerifyRedirect(argv.file, argv.domain, argv.parallel);
r.verify();
