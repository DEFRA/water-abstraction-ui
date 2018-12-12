const { get } = require('lodash');
const config = require('../../config');

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
  const base = {
    userType: 'not_logged_in',
    propertyId: config.googleAnalytics.propertyId,
    debug: config.googleAnalytics.debug,
    isLoggedIn: false
  };

  if (credentials) {
    const { lastLogin, scope = [] } = credentials;

    return Object.assign(base, {
      userType: scope.includes('internal') ? 'internal' : 'external',
      isLoggedIn: true,
      newUser: lastLogin === null,
      lastLogin
    });
  };

  return base;
};

function viewContextDefaults (request) {
  var viewContext = {};

  viewContext.isAuthenticated = !!get(request, 'state.sid');
  viewContext.query = request.query;
  viewContext.payload = request.payload;
  viewContext.session = request.session;
  viewContext.nonces = get(request, 'plugins.blankie.nonces', {});

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

  // Main nav links
  viewContext.mainNavLinks = [];
  if (request.permissions && request.permissions.admin.defra) {
    if (request.permissions && request.permissions.licences.read) {
      viewContext.mainNavLinks.push({
        id: 'view',
        text: 'View licences',
        url: '/admin/licences'
      });
    }
    if (request.permissions && request.permissions.admin.defra) {
      viewContext.labels.licences = 'Licences';

      // Abstraction reform
      if (request.permissions.ar.read) {
        viewContext.mainNavLinks.push({
          id: 'ar',
          text: 'Abstraction reform',
          url: '/admin/abstraction-reform'
        });
      }

      viewContext.mainNavLinks.push({
        id: 'notifications',
        text: 'Reports and notifications',
        url: '/admin/notifications'
      });
    }

    if (request.permissions.hasPermission('returns.edit')) {
      viewContext.mainNavLinks.push({
        id: 'returns',
        text: 'Manage returns',
        url: '/admin/returns'
      });
    }
  } else {
    if (request.permissions && request.permissions.licences.read) {
      viewContext.mainNavLinks.push({
        id: 'view',
        text: 'View licences',
        url: '/licences'
      });
    }
    if (request.permissions && request.permissions.returns.read) {
      viewContext.mainNavLinks.push({
        id: 'returns',
        text: 'Manage returns',
        url: '/returns'
      });
    }
    if (request.permissions && request.permissions.licences.edit) {
      viewContext.mainNavLinks.push({
        id: 'manage',
        text: 'Add licences or give access',
        url: '/manage_licences'
      });
    }
  }

  // Utility links - change password and sign out
  viewContext.propositionLinks = [{
    id: 'change-password',
    text: 'Change password',
    url: '/update_password'
  }, {
    id: 'signout',
    text: 'Sign out',
    url: '/signout'
  }];

  if (viewContext.isAdmin) {
    const contactInformationLink = {
      id: 'contact-information',
      text: 'Contact information',
      url: '/admin/contact-information'
    };
    viewContext.propositionLinks = [contactInformationLink, ...viewContext.propositionLinks];
  }

  viewContext.user = request.auth.credentials;

  viewContext.permissions = request.permissions;

  viewContext.tracking = getTracking(request.auth.credentials);

  /*
  if (request.auth.credentials) {
    viewContext.tracking = request.auth.credentials.user_data;
  } else {
    viewContext.tracking = { usertype: 'not_logged_in' };
  }
  */

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
