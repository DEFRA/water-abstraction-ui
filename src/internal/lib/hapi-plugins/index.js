module.exports = {
  config: require('../../../shared/lib/plugins/config'),
  csrf: require('./csrf'),
  metaRedirect: require('./meta-redirect'),
  redirect: require('./redirect'),
  secureHeaders: require('./secure-headers'),

  // licence details should be loaded before the view context is
  // updated with the main navigation.
  licenceLoader: require('./licence-loader'),

  viewContext: {
    plugin: require('../../../shared/lib/plugins/view-context'),
    options: {
      getContextDefaults: require('../view').contextDefaults
    }
  },

  formValidator: require('./form-validator'),
  error: require('./error'),
  noRobots: require('../../../shared/lib/plugins/no-robots'),
  staticAssets: require('../../../shared/lib/plugins/static-assets'),
  anonGoogleAnalytics: require('../../../shared/lib/plugins/anon-google-analytics'),
  authCredentials: require('./auth-credentials'),
  companySelection: require('./company-selection')
};
