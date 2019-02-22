module.exports = {
  config: require('./config'),
  sessions: require('./sessions'),
  csrf: require('./csrf'),
  error: require('./error'),
  permissions: require('./permissions'),
  adminFirewall: require('./admin-firewall'),
  redirect: require('./redirect'),
  secureHeaders: require('./secure-headers'),

  // licence details should be loaded before the view context is
  // updated with the main navigation.
  licenceLoader: require('./licence-loader'),

  viewContext: require('./view-context'),
  formValidator: require('./form-validator'),
  anonGoogleAnalytics: require('./anon-google-analytics'),
  authCredentials: require('./auth-credentials')
};
