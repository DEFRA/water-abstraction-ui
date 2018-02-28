console.log(__dirname);

function viewContextDefaults (request) {
  var viewContext = {};

  viewContext.isAuthenticated = request.auth.isAuthenticated;
  viewContext.query = request.query;
  viewContext.payload = request.payload;
  viewContext.session = request.session;
  viewContext.pageTitle = 'Water Abstraction';
  viewContext.insideHeader = '';
  viewContext.headerClass = 'with-proposition';
  viewContext.topOfPage = null;
  viewContext.head = null;
  viewContext.bodyStart = null;
  viewContext.afterHeader = null;
  viewContext.path = request.path;
  viewContext.debug = {};
  viewContext.debug.connection = request.connection.info;
  viewContext.debug.request = request.info;
  viewContext.debug.request.path = request.path;

  viewContext.labels={}
  viewContext.labels.licences='Your licences'
  // Main nav links
  viewContext.propositionLinks = [];

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


  if (request.permissions && request.permissions.admin.defra) {
    viewContext.labels.licences='Licences'
    viewContext.propositionLinks.push({
      id: 'dashboard',
      text: 'Service Dashboard',
      url: '/dashboard'
    });
  }

  viewContext.user = request.auth.credentials;

  viewContext.permissions=request.permissions;

  if (request.auth.credentials) {
    viewContext.tracking = request.auth.credentials.user_data;
  } else {
    viewContext.tracking = {usertype: 'not_logged_in'};
  }

  viewContext.env = process.env.NODEENV;
  viewContext.crownCopyrightMessage = '© Crown copyright';

  return viewContext;
}

module.exports = {
  contextDefaults: viewContextDefaults
};
