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

  // Main nav links
  viewContext.propositionLinks = [];

  if (request.auth.isAuthenticated) {
    // All authenticated users can view the 'View licences' link
    viewContext.propositionLinks.push({
      id: 'view',
      text: 'View your licences',
      url: '/licences'
    });

    // Only users who have primary_user role for a single org can use 'Manage licences' link
    const { roles } = request.auth.credentials;
    if (roles.length === 1 && roles[0].role === 'primary_user') {
      viewContext.propositionLinks.push({
        id: 'manage',
        text: 'Manage your licences',
        url: '/manage_licences'
      });
    }
  }

  //  viewContext.debug.session = request.yar.get('sessionTimestamp')

  viewContext.user = request.auth.credentials;
  viewContext.env = process.env.NODEENV;
  viewContext.crownCopyrightMessage = '© Crown copyright';

  return viewContext;
}

module.exports = {
  contextDefaults: viewContextDefaults
};
