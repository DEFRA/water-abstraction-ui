const { get } = require('lodash');

const { getPropositionLinks } = require('./view/proposition-links');
const { getMainNav } = require('./view/main-nav');

const getSurveyType = (isAuthenticated, isDefraAdmin) => {
  if (isAuthenticated) {
    return isDefraAdmin ? 'internal' : 'external';
  }
  return 'anonymous';
};

/**
 * Get GA tracking details given user credentials
 * @param {Object} credentials
 * @return {Object} tracking
 */
const getTracking = (credentials) => {
  if (credentials) {
    const { lastlogin: lastLogin, scope = [] } = credentials;

    return {
      usertype: scope.includes('internal') ? 'internal' : 'external',
      newuser: lastLogin === null,
      lastlogin: lastLogin
    };
  };

  return {
    usertype: 'not_logged_in'
  };
};

function viewContextDefaults (request) {
  const viewContext = request.view || {};
  // console.log(request.plugins.viewContext);
  // const viewContext = request.
  // var viewContext = request.view || {};

  viewContext.isAuthenticated = !!get(request, 'state.sid');
  viewContext.query = request.query;
  viewContext.payload = request.payload;
  viewContext.session = request.session;
  viewContext.nonces = get(request, 'plugins.blankie.nonces', {});

  // H1 page title
  // viewContext.pageTitle = 'Water Abstraction';
  // Title tag - if different from page title
  viewContext.customTitle = null;
  viewContext.insideHeader = '';
  viewContext.headerClass = 'with-proposition';
  viewContext.topOfPage = null;
  viewContext.head = `<meta name="format-detection" content="telephone=no"><meta name="robots" content="noindex, nofollow">`;
  viewContext.bodyStart = null;
  viewContext.afterHeader = null;
  viewContext.path = request.path;
  // viewContext.debug = {};
  // viewContext.debug.connection = request.connection.info;
  // viewContext.debug.request = request.info;
  // viewContext.debug.request.path = request.path;

  if (request.sessionStore) {
    viewContext.csrfToken = request.sessionStore.get('csrf_token');
  }

  viewContext.labels = {};
  viewContext.labels.licences = 'Your licences';

  // Are we in admin view?  Add a flag for templates
  viewContext.isAdmin = /^\/admin\//.test(request.url.path);
  viewContext.isTestMode = process.env.TEST_MODE;

  // Set navigation links
  viewContext.mainNavLinks = getMainNav(request);
  viewContext.propositionLinks = getPropositionLinks(request);

  viewContext.user = request.auth.credentials;

  viewContext.permissions = request.permissions;

  viewContext.tracking = getTracking(request.auth.credentials);

  viewContext.env = process.env.NODE_ENV;
  viewContext.crownCopyrightMessage = '© Crown copyright';
  viewContext.surveyType = getSurveyType(
    viewContext.isAuthenticated,
    get(viewContext, 'permissions.admin.defra', false)
  );

  return viewContext;
}

module.exports = {
  contextDefaults: viewContextDefaults,
  getTracking
};
