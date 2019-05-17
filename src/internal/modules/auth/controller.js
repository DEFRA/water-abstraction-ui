/**
 * HAPI Route handlers for signing in to account
 * @module controllers/authentication
 */
const { get } = require('lodash');

const IDM = require('../../lib/connectors/idm');
const signIn = require('../../lib/sign-in');
const { logger } = require('../../logger');
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
    await request.sessionStore.destroy();
    request.cookieAuth.clear();
  } catch (error) {
    logger.error('Sign out error', error);
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
  const form = handleRequest(signInForm(), request, signInSchema);

  // Perform basic validation
  if (!form.isValid) {
    return getSignin(request, h, signInApplyErrorState(form));
  }

  // Attempt auth
  try {
    const {
      body: {
        reset_required: resetRequired,
        reset_guid: resetGuid
      }
    } = await IDM.login(request.payload.email, request.payload.password);

    await helpers.destroySession(request);

    // Check if reset required
    if (resetRequired === 1) {
      return h.redirect(`/reset_password_change_password?resetGuid=${resetGuid}&forced=1`);
    }

    await signIn.auto(request, request.payload.email);

    return h.realm.pluginOptions.onSignIn(request, h);
  } catch (error) {
    if (error.statusCode === 401) {
      return getSignin(request, h, signInApplyErrorState(form));
    }
    throw error;
  }
};

exports.getSignin = getSignin;
exports.getSignout = getSignout;
exports.getSignedOut = getSignedOut;
exports.postSignin = postSignin;
