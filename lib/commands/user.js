var prompt = require('prompt');

var chalk = require('../chalk');
var log = require('../log');
var core = require('../core');
var session = require('../session');
var lc_session = require('../plugins/lc.session')

var cmd = {
  command: 'user',
  desc:    'login/logout with leetcode account',
  builder: {
    login: {
      alias:    'l',
      type:     'boolean',
      default:  false,
      describe: 'Login'
    },
    logout: {
      alias:    'L',
      type:     'boolean',
      default:  false,
      describe: 'Logout'
    },
    session: {
      alias:    's',
      type:     'integer',
      default:  '',
      describe: 'activate session_id'
    }
  }
};

cmd.handler = function(argv) {
  session.argv = argv;
  var user = null;
  if (argv.login) {
    // login
    prompt.colors = false;
    prompt.message = '';
    prompt.start();
    prompt.get([
      {name: 'login', required: true},
      {name: 'pass', required: true, hidden: true}
    ], function(e, user) {
      if (e) return log.fail(e);

      core.login(user, function(e, user) {
        if (e) return log.fail(e);

        log.info('Successfully login as', chalk.yellow(user.name));
      });
    });
  } else if (argv.logout) {
    // logout
    user = core.logout(user, true);
    if (user)
      log.info('Successfully logout as', chalk.yellow(user.name));
    else
      log.fail('You are not login yet?');
  } else if (argv.session) {
    // switch session
    lc_session.activeSession(argv.session, function(e, sessionId) {
      if (e) return log.fail(e);
      log.info('Successfully activate session');
      lc_session.showProgress();
    });

  } else {
    // show current user
    user = session.getUser();
    if (user) {
      log.info('You are now login as', chalk.yellow(user.name));
      lc_session.showProgress();
    }
    else
      return log.fail('You are not login yet?');
  }
};

module.exports = cmd;
