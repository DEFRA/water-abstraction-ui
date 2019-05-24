module.exports = {
  config: require('./config'),
  csrf: require('./csrf'),
  adminFirewall: require('./admin-firewall'),
  metaRedirect: require('./meta-redirect'),
  redirect: require('./redirect'),
  secureHeaders: require('./secure-headers'),

  // licence details should be loaded before the view context is
  // updated with the main navigation.
  licenceLoader: require('./licence-loader'),

  viewContext: require('./view-context'),
  formValidator: require('./form-validator'),
  anonGoogleAnalytics: require('./anon-google-analytics'),
  // companySelection: require('./company-selection'),
  error: require('./error')
};
