var http = require('http'),
  fs = require('fs'),
  async = require('async'),
  EOL = require('os').EOL,
  request = require('request'),
  path = require('path'),
  urlParser = require('url'),
  nonWorkingStartUrls = [],
  workingUrls = [],
  noWorkingUrls = 0,
  tested = 0,
  noNonWorkingUrls = 0;

function VerifyRedirect(filename, starturl, parallel) {
  var data = fs.readFileSync(filename);
  this.starturl = starturl;
  this.parallel = parallel || 1;
  // remove empty lines
  this.fromTo = data.toString().split(EOL).filter(function(l) {
    return l.length > 0;
  });

  // do we have multiple instances of fromTo urls?
  var fromUrls = [];
  var shouldBreak = false;
  this.fromTo.forEach(function(line) {
    var fromAndTo = line.split(';');
    var from = fromAndTo[0];
    var to = fromAndTo[1];
    if (fromUrls.indexOf(from) > -1) {
      console.log('We have duplicate lines with this from url ' + from + ' --> ' + to);
      shouldBreak = true;
    }
    else
     {
       fromUrls.push(from);
     }
  });

  if (shouldBreak) {
    console.log('Clean the list of duplicates and run again');
    process.exit(255);
  }

};

VerifyRedirect.prototype.verify = function() {
  console.log('Will test ' + this.fromTo.length + ' urls for ' + this.starturl + ' ' + this.parallel + ' in parallel');
  var self = this;
  var work = [];
  this.fromTo.forEach(function(line) {
    var fromTo = line.split(';');
    work.push(function(cb) {
      // hack for removing \r at the end of each line
      verify(self.starturl + fromTo[0], self.starturl + fromTo[1].replace('\r',''), cb);
    });
  });

  async.parallelLimit(work, self.parallel, function(err, results) {
    console.log('Finished. Got ' + noWorkingUrls + ' working URLS and ' + noNonWorkingUrls + ' non working');
    if (nonWorkingStartUrls.length>0) {
      console.log('-------------------------------------------');
      console.log('These are the start URL:s that don\'t work:');
      var failingResult = 'start url, end url, error code, error' + EOL;
      nonWorkingStartUrls.forEach(function(url) {
        failingResult = failingResult +  url.startUrl + ',' +  url.endUrl + ',' + (url.code>0 ? url.code:'unknown') + ','+ ((url.error)?' ' + url.error:'') + EOL;
      });
      console.log(failingResult);

      var filename = path.join(process.cwd(), path.sep, urlParser.parse(self.starturl).hostname + '-failing.csv');
      fs.writeFileSync(filename, failingResult);
      console.log('Stored non working urls in ' + filename);

      var workingResult = 'start url, end url' + EOL;
      workingUrls.forEach(function(url) {
        workingResult  = workingResult +  url.startUrl + ',' +  url.endUrl + EOL;
      });

      filename = path.join(process.cwd(), path.sep, urlParser.parse(self.starturl).hostname + '-working.csv');
      fs.writeFileSync(filename, workingResult);
      console.log('Stored working urls in ' + filename);
    }
  });

};

function verify(startUrl, configuredEndUrl, cb) {
    console.log('Will test from ' + startUrl + ' --> ' + configuredEndUrl);
    var r = request({url: startUrl, maxRedirects: 1}, function(error, response, body) {

    tested++;
    if (error) {
      console.log('Couldn\'t fetch ' + startUrl + ' ' + error);
      noNonWorkingUrls++;
      // nice message if it is a redirect
      if (error.message.indexOf('Exceeded maxRedirects') > -1) {
        nonWorkingStartUrls.push({'startUrl': startUrl, 'endUrl':configuredEndUrl,'code':-1, 'error':'The ' + startUrl + ' makes more than 1 redirect. Please change so only one redirect is made before we reach the end url. Extra info: ' + error });
      }
      else {
        nonWorkingStartUrls.push({'startUrl': startUrl, 'endUrl':configuredEndUrl,  'code':-1, 'error':error});
      }
    }
    else {

    var endUrl = response.request.uri.href;

    if (response.statusCode === 200) {
      if (configuredEndUrl === endUrl) {
        noWorkingUrls++;
        workingUrls.push({'startUrl':startUrl, 'endUrl': configuredEndUrl});
      } else
        if (startUrl === endUrl) {
          // we didn't do any redirect right?
          console.log('Start URL is working (gives 200). Start url:' + startUrl + ' Configured endURL:' +
          configuredEndUrl + ' endUrl:' + endUrl);
          noNonWorkingUrls++;
          nonWorkingStartUrls.push({'startUrl': startUrl, 'endUrl': configuredEndUrl, 'code':response.statusCode, 'error':'Start URL is working (gives 200) and cannot be redirected.'});

        }
        else
       {
	      console.log('Wrong end url. Start url:' + startUrl + ' Configured endURL:' +
        configuredEndUrl + ' endUrl:' + endUrl);
        noNonWorkingUrls++;
        nonWorkingStartUrls.push({'startUrl': startUrl, 'endUrl': configuredEndUrl,  'code':response.statusCode, 'error':'The redirect ends up on the wrong url. Should be ' + configuredEndUrl + ' but ends up on ' + endUrl});
      }
    } else {
      console.log('Couldnt fetch the url:' + startUrl + ' statusCode:' + response.statusCode);
      noNonWorkingUrls++;

      // we are on the same page
      if (startUrl === response.request.uri.href) {
      nonWorkingStartUrls.push({'startUrl': startUrl, 'endUrl':configuredEndUrl,  'code':response.statusCode, 'error':'The start url ' + startUrl + ' gets an ' + response.statusCode + ' error'});
      }
      else {
        nonWorkingStartUrls.push({'startUrl': startUrl, 'endUrl':configuredEndUrl,  'code':response.statusCode, 'error':'The redirected url (from ' + startUrl + ' ) ' + response.request.uri.href + ' gets an ' + response.statusCode + ' error'});
      }
    }
  }
    cb();
  });
}

module.exports = VerifyRedirect;
