/**
 * HAPI Route handlers for signing in to account
 * @module controllers/authentication
 */
const { get } = require('lodash');

// const IDM = require('shared/lib/connectors/idm');
// const { logger } = require('../../logger');

const helpers = require('./helpers');
const { signInForm, signInSchema, signInApplyErrorState } = require('./forms');
const { handleRequest, setValues } = require('../../../shared/lib/forms');
const isAuthenticated = request => !!get(request, 'state.sid');

/**
 * View signin page
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} h - the Hapi Response Toolkit
 */
function getSignin (request, h, form) {
  if (isAuthenticated(request)) {
    return h.realm.pluginOptions.ifAuthenticated(request, h);
  }

  const view = {
    ...request.view,
    form: setValues(form || signInForm(), { password: '' }),
    pageTitle: 'Sign in',
    showResetMessage: get(request, 'query.flash') === 'password-reset'
  };

  return h.view('nunjucks/auth/sign-in.njk', view, { layout: false });
}

/**
 * View signout page
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} h - the HAPI response toolkit
 */
async function getSignout (request, h) {
  try {
    await request.logOut();
  } catch (error) {
    request.log('error', 'Sign out error', { error });
  }
  return h.realm.pluginOptions.onSignOut(request, h);
}

/**
 * View signed out page
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} h - the HAPI HTTP response toolkit
 */
async function getSignedOut (request, h) {
  const surveyType = { i: 'internal', e: 'external' };
  request.view.surveyType = surveyType[request.query.u] || 'anonymous';
  request.view.pageTitle = 'You are signed out';
  return h.view('nunjucks/auth/signed-out.njk', request.view, { layout: false });
}

/**
 * Process login form request
 * @param {Object} request - the HAPI HTTP request
 * @param {String} request.payload.user_id - the user email address
 * @param {String} request.payload.password - the user password
 * @param {Object} h - the Hapi Response Toolkit
 */
const postSignin = async (request, h) => {
  const idmConnector = request.server.methods.getConnector('idm');

  const form = handleRequest(signInForm(), request, signInSchema);

  // Perform basic validation
  if (!form.isValid) {
    return getSignin(request, h, signInApplyErrorState(form));
  }

  // Destroy existing session
  await helpers.destroySession(request);

  const { email, password } = request.payload;

  const { success, resetRequired, resetGuid } = await idmConnector.users.authenticate(email, password);

  // Auth success
  if (success) {
    await request.logIn(email);
    return h.realm.pluginOptions.onSignIn(request, h);
  }

  // Forced reset
  if (resetRequired) {
    return h.redirect(`/reset_password_change_password?resetGuid=${resetGuid}&forced=1`);
  }

  return getSignin(request, h, signInApplyErrorState(form));
};

exports.getSignin = getSignin;
exports.getSignout = getSignout;
exports.getSignedOut = getSignedOut;
exports.postSignin = postSignin;
