module.exports = {
  config: require('shared/plugins/config'),
  csrf: require('shared/plugins/csrf'),
  cookieMessage: require('shared/plugins/cookie-message'),
  metaRedirect: require('shared/plugins/meta-redirect'),
  secureHeaders: require('shared/plugins/secure-headers'),

  viewContext: {
    plugin: require('shared/plugins/view-context'),
    options: {
      getContextDefaults: require('../view').contextDefaults
    }
  },

  formValidator: require('./form-validator'),
  noRobots: require('shared/plugins/no-robots'),
  staticAssets: require('shared/plugins/static-assets'),
  anonGoogleAnalytics: require('shared/plugins/anon-google-analytics'),
  acceptanceTestsProxy: require('shared/plugins/acceptance-tests-proxy'),
  csp: require('shared/plugins/csp')
};
