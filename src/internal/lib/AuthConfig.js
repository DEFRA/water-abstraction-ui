const AuthConfigBase = require('shared/lib/AuthConfig');
const { logger } = require('internal/logger');
const { pick } = require('lodash');

class AuthConfig extends AuthConfigBase {
  ifAuthenticated (request, h) {
    return h.metaRedirect('/licences');
  }

  async onSignIn (request, h, user) {
    return h.metaRedirect('/licences');
  };

  onSignOut (request, h) {
    return h.metaRedirect(`/signed-out?u=i`);
  }

  onUnauthorized (request, h) {
    logger.info(pick(request.response, ['error', 'message', 'statusCode', 'stack']));
    return h.redirect('/signin');
  }
}

module.exports = AuthConfig;
