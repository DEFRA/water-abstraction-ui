/**
 * HAPI Route handlers for signing in to account
 * @module controllers/authentication
 */
const IDM = require('../../lib/connectors/idm');
const View = require('../../lib/view');
const signIn = require('../../lib/sign-in');
const { getPermissions } = require('../../lib/permissions');

const { destroySession, authValidationErrorResponse } = require('./helpers');

/**
 * Welcome page before routing to signin/register
 */
function getWelcome (request, reply) {
  var viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'Choose an option to view your licences';
  return reply.view('water/welcome', viewContext);
}

/**
 * View signin page
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 */
function getSignin (request, reply) {
  var viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'Sign in';
  viewContext.customTitle = 'Sign in - Manage your water abstraction or impoundment licence';
  return reply.view('water/auth/signin', viewContext);
}

/**
 * View signout page
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 */
async function getSignout (request, reply) {
  try {
    await request.sessionStore.destroy();
    request.cookieAuth.clear();
  } catch (error) {
    request.log('error', error);
  }
  return reply.redirect('/');
}

/**
 * Process login form request
 * @param {Object} request - the HAPI HTTP request
 * @param {String} request.payload.user_id - the user email address
 * @param {String} request.payload.password - the user password
 * @param {Object} reply - the HAPI HTTP response
 */
async function postSignin (request, reply) {
  // Handle form validation error
  if (request.formError) {
    return authValidationErrorResponse(request, reply);
  }

  // Attempt auth
  try {
    const {
      body: {
        reset_required: resetRequired,
        reset_guid: resetGuid,
        user_data: userData,
        last_login: lastLogin
      }
    } = await IDM.login(request.payload.user_id, request.payload.password);

    await destroySession(request);

    // Check if reset required
    if (resetRequired === 1) {
      return reply.redirect(`reset_password_change_password?resetGuid=${resetGuid}&forced=1`);
    }

    const session = await signIn.auto(request, request.payload.user_id, userData, lastLogin);

    // Redirect user
    const permissions = await getPermissions({ roles: session.roles });
    const redirectPath = permissions.admin.defra ? '/admin/licences' : '/licences';

    // Resolves Chrome issue where it won't set cookie and redirect in same request
    // @see {@link https://stackoverflow.com/questions/40781534/chrome-doesnt-send-cookies-after-redirect}
    return reply.response(`<meta http-equiv="refresh" content="0; url=${redirectPath}" /><script>location.href='${redirectPath}';</script>`);
  } catch (error) {
    if (error.statusCode === 401) {
      return authValidationErrorResponse(request, reply);
    }
    throw error;
  }
}

module.exports = {
  getWelcome,
  getSignin,
  getSignout,
  postSignin
};
