const { get } = require('lodash');
const config = require('../config');

const { getPropositionLinks } = require('./view/proposition-links');
const { getMainNav } = require('./view/main-nav');

const getSurveyType = isAuthenticated => isAuthenticated ? 'internal' : 'anonymous';

/**
 * Get GA tracking details given user credentials
 * @param {Object} defra
 * @return {Object} tracking
 */
const getTracking = (defra) => {
  const base = {
    userType: 'not_logged_in',
    propertyId: config.googleAnalytics.propertyId,
    debug: config.googleAnalytics.debug,
    isLoggedIn: false
  };

  if (defra) {
    const { lastLogin } = defra;

    return Object.assign(base, {
      userType: 'internal',
      isLoggedIn: true,
      newUser: lastLogin === null,
      lastLogin
    });
  };

  return base;
};

/**
 * Checks whether the user has multiple companies - i.e. agent
 * this determines whether to show company switcher
 * @param  {Object}  request - current request
 * @return {Boolean}         true if user can access > 1 company
 */

function viewContextDefaults (request) {
  const viewContext = request.view || {};

  viewContext.isAuthenticated = !!get(request, 'state.sid');
  viewContext.query = request.query;
  viewContext.payload = request.payload;
  viewContext.session = request.session;
  viewContext.nonces = get(request, 'plugins.blankie.nonces', {});

  viewContext.customTitle = null;
  viewContext.insideHeader = '';
  viewContext.headerClass = 'with-proposition';
  viewContext.topOfPage = null;
  viewContext.head = `<meta name="format-detection" content="telephone=no"><meta name="robots" content="noindex, nofollow">`;
  viewContext.bodyStart = null;
  viewContext.afterHeader = null;
  viewContext.path = request.path;

  viewContext.csrfToken = request.yar.get('csrfToken');

  viewContext.labels = {};
  viewContext.labels.licences = 'Your licences';

  viewContext.isTestMode = process.env.TEST_MODE;

  // Set navigation links
  viewContext.mainNavLinks = getMainNav(request);
  viewContext.propositionLinks = getPropositionLinks(request);

  viewContext.showCookieMessage = !(request.state.seen_cookie_message === 'yes');
  viewContext.user = request.auth.credentials;

  viewContext.tracking = getTracking(request.defra);

  viewContext.env = process.env.NODE_ENV;
  viewContext.crownCopyrightMessage = '© Crown copyright';
  viewContext.surveyType = getSurveyType(viewContext.isAuthenticated);

  return viewContext;
}

module.exports = {
  contextDefaults: viewContextDefaults,
  getTracking
};
