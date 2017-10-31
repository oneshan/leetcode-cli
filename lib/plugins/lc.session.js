var _ = require('underscore');
var request = require('request');

var config = require('../config');
var log = require('../log');
var chalk = require('../chalk');
var Plugin = require('../plugin');
var session = require('../session');

var plugin = new Plugin(200, 'lc.session', '2017.10.31',
    'Plugin to switch sessions');

var URL_SESSION = 'https://leetcode.com/session/';
var URL_PROGRESS = 'https://leetcode.com/api/progress/all/'


// update options with user credentials
function makeOpts(url) {
  var opts = {};
  var user = session.getUser();
  opts.url = url;
  opts.headers = {
    'Cookie': 'LEETCODE_SESSION=' + user.sessionId +
               ';csrftoken=' + user.sessionCSRF + ';',
    'Origin': config.URL_BASE,
    'Referer': url,
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) ' + 
                  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                  'Chrome/54.0.2840.98 Safari/537.36',
    'dnt': 1,
    'X-CSRFToken': user.sessionCSRF,
    'X-Requested-With': 'XMLHttpRequest'
  }

  return opts;
}


function checkError(e, resp, expectedStatus) {
  if (!e && resp && resp.statusCode !== expectedStatus) {
    var code = resp.statusCode;
    log.debug('http error: ' + code);

    if (code === 403 || code === 401) {
      e = session.errors.EXPIRED;
    } else {
      e = {msg: 'http error', statusCode: code};
    }
  }
  return e;
}

plugin.showProgress = function(cb) {
  log.debug('running modify.session.showProgress');
  var opts = makeOpts(URL_PROGRESS);
  
  request(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);
    var json = JSON.parse(body);
    log.printf(chalk.yellow('Current Session [%s]'),
        (json.sessionName.length === 0) ? 'Anonymous Session': json.sessionName);
    log.printf('Question total=%d, solved=%d, unsolved=%d',
        json.questionTotal, json.solvedTotal, json.unsolved);
    log.printf('Easy=%d, Medium=%d, Hard=%d',
        json.solvedPerDifficulty.Easy, json.solvedPerDifficulty.Medium, json.solvedPerDifficulty.Hard);
    log.printf('\nOther sessions');
    for(var i in json.sessionList) {
        log.printf('%7d [%s]', json.sessionList[i].id, 
            (json.sessionList[i].name.length === 0) ? 'Anonymous Session': json.sessionList[i].name);
    }
  });
};

plugin.activeSession = function(sessionId, cb) {
  log.debug('running modify.session.activeSession');
  var opts = makeOpts(URL_SESSION);
  opts.method = 'PUT';
  opts.json = true;
  opts.body = {
    func: "activate",
    target: sessionId
  };

  request(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);
    return cb(null);
  });
};

plugin.login = function(user, cb) {
  plugin.next.login(user, function(e, user) {
    if (e) return cb(e);
    plugin.showProgress(cb);
    return cb(null, user);
  });
};

module.exports = plugin;
