module.exports = {
  config: require('../../../shared/lib/plugins/config'),
  csrf: require('./csrf'),
  metaRedirect: require('./meta-redirect'),
  redirect: require('./redirect'),
  secureHeaders: require('./secure-headers'),
  viewContext: require('./view-context'),
  formValidator: require('./form-validator'),
  error: require('./error'),
  noRobots: require('../../../shared/lib/plugins/no-robots'),
  staticAssets: require('../../../shared/lib/plugins/static-assets'),
  anonGoogleAnalytics: require('../../../shared/lib/plugins/anon-google-analytics'),
  authCredentials: require('./auth-credentials'),
  companySelection: require('./company-selection')
};
