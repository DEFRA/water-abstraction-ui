module.exports = {
  config: require('shared/plugins/config'),
  csrf: require('shared/plugins/csrf'),
  metaRedirect: require('shared/plugins/meta-redirect'),
  redirect: require('shared/plugins/redirect'),
  secureHeaders: require('shared/plugins/secure-headers'),

  // licence details should be loaded before the view context is
  // updated with the main navigation.
  licenceLoader: require('./licence-loader'),

  viewContext: {
    plugin: require('shared/plugins/view-context'),
    options: {
      getContextDefaults: require('../view').contextDefaults
    }
  },

  formValidator: require('./form-validator'),
  anonGoogleAnalytics: require('shared/plugins/anon-google-analytics'),
  companySelection: require('./company-selection'),
  error: require('./error'),
  noRobots: require('shared/plugins/no-robots'),
  staticAssets: require('shared/plugins/static-assets'),
  userJourney: require('shared/plugins/user-journey')
};
