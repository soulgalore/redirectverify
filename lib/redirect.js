var http = require('http'),
  fs = require('fs'),
  async = require('async'),
  EOL = require('os').EOL,
  request = require('request'),
  path = require('path'),
  urlParser = require('url'),
  nonWorkingStartUrls = [],
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
      var result = '';
      nonWorkingStartUrls.forEach(function(url) {
        result = result + url.url + ' ' + (url.code>0 ? url.code:'') + ((url.error)?' ' + url.error:'') + EOL;
      });
      console.log(result);

      var filename = path.join(process.cwd(), path.sep, urlParser.parse(self.starturl).hostname + '.txt');
      fs.writeFileSync(filename, result);
      console.log('Stored non working urls in ' + filename);
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
      nonWorkingStartUrls.push({'url': startUrl, 'code':-1, 'error':error});
    }
    else {

    var endUrl = response.request.uri.href;

    if (response.statusCode === 200) {
      if (configuredEndUrl === endUrl) {
        noWorkingUrls++;
      } else {
	      console.log('Wrong end url. Start url:' + startUrl + ' Configured endURL:' +
        configuredEndUrl + ' endUrl:' + endUrl);
        noNonWorkingUrls++;
        nonWorkingStartUrls.push({'url': startUrl, 'code':response.statusCode, 'error':'Wrong endUrl:' + endUrl});
      }
    } else {
      console.log('Couldnt fetch the start url:' + startUrl + ' statusCode:' + response.statusCode);
      noNonWorkingUrls++;
      nonWorkingStartUrls.push({'url': startUrl, 'code':response.statusCode, 'error':error});
    }
  }
    cb();
  });
}

module.exports = VerifyRedirect;
