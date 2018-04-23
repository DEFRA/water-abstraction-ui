console.log(__dirname);

function viewContextDefaults (request) {
  var viewContext = {};

  viewContext.isAuthenticated = request.auth.isAuthenticated;
  viewContext.query = request.query;
  viewContext.payload = request.payload;
  viewContext.session = request.session;
  // H1 page title
  viewContext.pageTitle = 'Water Abstraction';
  // Title tag - if different from page title
  viewContext.customTitle = null;
  viewContext.insideHeader = '';
  viewContext.headerClass = 'with-proposition';
  viewContext.topOfPage = null;
  viewContext.head = `<meta name="format-detection" content="telephone=no"><meta name="robots" content="noindex, nofollow">`;
  viewContext.bodyStart = null;
  viewContext.afterHeader = null;
  viewContext.path = request.path;
  viewContext.debug = {};
  viewContext.debug.connection = request.connection.info;
  viewContext.debug.request = request.info;
  viewContext.debug.request.path = request.path;

  if (request.sessionStore) {
    viewContext.csrfToken = request.sessionStore.get('csrf_token');
  }

  viewContext.labels = {};
  viewContext.labels.licences = 'Your licences';
  // Main nav links
  viewContext.propositionLinks = [];

  // Are we in admin view?  Add a flag for templates
  viewContext.isAdmin = /^\/admin\//.test(request.url.path);
  viewContext.isAbstractionReform = /^\/ar\//.test(request.url.path);
  viewContext.isTestMode = process.env.test_mode;

  // Admin view
  if (request.permissions && request.permissions.admin.defra) {
    if (request.permissions && request.permissions.licences.read) {
      viewContext.propositionLinks.push({
        id: 'view',
        text: 'View licences',
        url: '/admin/licences'
      });
    }
    if (request.permissions && request.permissions.admin.defra) {
      viewContext.labels.licences = 'Licences';
      viewContext.propositionLinks.push({
        id: 'dashboard',
        text: 'View service usage',
        url: '/dashboard'
      });
    }
  } else {
    if (request.permissions && request.permissions.licences.read) {
      viewContext.propositionLinks.push({
        id: 'view',
        text: 'View your licences',
        url: '/licences'
      });
    }
    if (request.permissions && request.permissions.licences.edit) {
      viewContext.propositionLinks.push({
        id: 'manage',
        text: 'Manage your licences',
        url: '/manage_licences'
      });
    }
  }

  viewContext.user = request.auth.credentials;

  viewContext.permissions = request.permissions;

  if (request.auth.credentials) {
    viewContext.tracking = request.auth.credentials.user_data;
  } else {
    viewContext.tracking = { usertype: 'not_logged_in' };
  }

  viewContext.env = process.env.NODEENV;
  viewContext.crownCopyrightMessage = '© Crown copyright';

  return viewContext;
}

module.exports = {
  contextDefaults: viewContextDefaults
};
