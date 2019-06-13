module.exports = {
  config: require('../../../shared/plugins/config'),
  csp: require('../../../shared/plugins/csp'),
  csrf: require('../../../shared/plugins/csrf'),
  metaRedirect: require('../../../shared/plugins/meta-redirect'),
  redirect: require('../../../shared/plugins/redirect'),
  secureHeaders: require('../../../shared/plugins/secure-headers'),

  viewContext: {
    plugin: require('../../../shared/plugins/view-context'),
    options: {
      getContextDefaults: require('../view').contextDefaults
    }
  },

  formValidator: require('./form-validator'),
  error: require('./error'),
  noRobots: require('../../../shared/plugins/no-robots'),
  staticAssets: require('../../../shared/plugins/static-assets'),
  anonGoogleAnalytics: require('../../../shared/plugins/anon-google-analytics')
};
