module.exports = {
  config: require('./config'),
  csrf: require('./csrf'),
  metaRedirect: require('./meta-redirect'),
  redirect: require('./redirect'),
  secureHeaders: require('./secure-headers'),
  viewContext: require('./view-context'),
  formValidator: require('./form-validator'),
  anonGoogleAnalytics: require('./anon-google-analytics'),
  error: require('./error'),
  noRobots: require('../../../shared/lib/plugins/no-robots'),
  staticAssets: require('../../../shared/lib/plugins/static-assets')
};
