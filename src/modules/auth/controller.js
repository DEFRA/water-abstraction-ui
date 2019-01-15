/**
 * HAPI Route handlers for signing in to account
 * @module controllers/authentication
 */
const { get } = require('lodash');
const IDM = require('../../lib/connectors/idm');
const signIn = require('../../lib/sign-in');
const { getPermissions } = require('../../lib/permissions');
const logger = require('../../lib/logger');

const { destroySession, authValidationErrorResponse } = require('./helpers');

/**
 * Welcome page before routing to signin/register
 */
function getWelcome (request, h) {
  return h.view('water/welcome', request.view);
}

/**
 * View signin page
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} h - the Hapi Response Toolkit
 */
function getSignin (request, h) {
  return h.view('water/auth/signin', request.view);
}

/**
 * View signout page
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} h - the HAPI response toolkit
 */
async function getSignout (request, h) {
  const params = `?u=${request.permissions.admin.defra ? 'i' : 'e'}`;
  try {
    await request.sessionStore.destroy();
    request.cookieAuth.clear();
  } catch (error) {
    logger.error('Sign out error', error);
  }
  return h.redirect(`/signed-out${params}`);
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
  return h.view('water/auth/signed-out', request.view);
}

/**
 * Process login form request
 * @param {Object} request - the HAPI HTTP request
 * @param {String} request.payload.user_id - the user email address
 * @param {String} request.payload.password - the user password
 * @param {Object} h - the Hapi Response Toolkit
 */
async function postSignin (request, h) {
  // Handle form validation error
  if (request.formError) {
    return authValidationErrorResponse(request, h);
  }

  // Attempt auth
  try {
    const {
      body: {
        reset_required: resetRequired,
        reset_guid: resetGuid
      }
    } = await IDM.login(request.payload.user_id, request.payload.password);

    await destroySession(request);

    // Check if reset required
    if (resetRequired === 1) {
      return h.redirect(`reset_password_change_password?resetGuid=${resetGuid}&forced=1`);
    }

    await signIn.auto(request, request.payload.user_id);

    // Redirect user
    const permissions = getPermissions(request.auth.credentials);
    const redirectPath = permissions.admin.defra ? '/admin/licences' : '/licences';

    // Resolves Chrome issue where it won't set cookie and redirect in same request
    // @see {@link https://stackoverflow.com/questions/40781534/chrome-doesnt-send-cookies-after-redirect}
    return h.response(getLoginRedirectHtml(request, redirectPath));
  } catch (error) {
    if (error.statusCode === 401) {
      return authValidationErrorResponse(request, h);
    }
    throw error;
  }
}

const getLoginRedirectHtml = (request, redirectPath) => {
  const nonce = get(request, 'plugins.blankie.nonces.script', {});
  const meta = `<meta http-equiv="refresh" content="0; url=${redirectPath}" />`;
  const script = `<script nonce=${nonce}>location.href='${redirectPath}';</script>`;
  return meta + script;
};

module.exports = {
  getWelcome,
  getSignin,
  getSignout,
  getSignedOut,
  postSignin
};
