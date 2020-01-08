const AuthConfigBase = require('shared/lib/AuthConfig');

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
    return h.redirect('/signin');
  }
}

module.exports = AuthConfig;
