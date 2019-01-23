const IDM = require('../../lib/connectors/idm');
const uuid = require('uuid/v4');
const mapJoiPasswordError = require('../reset-password/map-joi-password-error');
const { AuthTokenError } = require('./errors');
/**
 * Update password step 1 - enter current password
 */
async function getConfirmPassword (request, reply) {
  return reply.view('water/update-password/update_password', request.view);
}

/**
 * Update password step 1 POST handler - enter current password
 * @param {Object} request - HAPI HTTP request
 * @param {String} request.payload.password - user's current password in IDM
 * @param {Object} reply - HAPI HTTP reply interface
 */
async function postConfirmPassword (request, reply) {
  try {
    if (request.formError) {
      throw request.formError;
    }
    const { password } = request.payload;
    const { username } = request.auth.credentials;
    await IDM.verifyCredentials(username, password);

    // Create auth token to verify user in subsequent page in flow
    const authtoken = uuid();
    request.sessionStore.set('authToken', authtoken);

    return reply.view('water/update-password/update_password_verified_password', { authtoken, ...request.view });
  } catch (error) {
    return reply.view('water/update-password/update_password', { error, ...request.view });
  }
}

/**
 * Reset password form handler for signed-in user
 * @todo consider Joi for password validation
 * @param {String} request.payload.password - new password
 * @param {String} request.payload.confirmPassword - password again
 * @param {String} request.payload.authtoken - token to ensure user verified identity in previous step in flow
 */
async function postSetPassword (request, reply) {
  // Form validation error
  if (request.formError) {
    const errors = mapJoiPasswordError(request.formError);
    const { authtoken } = request.payload;
    return reply.view('water/update-password/update_password_verified_password', { ...request.view, errors, authtoken });
  }

  try {
    // Check for form errors
    if (request.formError) {
      throw request.formError;
    }
    // Check auth token
    const { authtoken, password } = request.payload;
    if (authtoken !== request.sessionStore.get('authToken')) {
      throw new AuthTokenError();
    }
    // Change password
    const { user_id: userId } = request.auth.credentials;
    const { error } = IDM.updatePassword(userId, password);
    if (error) {
      throw error;
    }

    // All OK
    return reply.redirect('/password_updated');
  } catch (error) {
    if (error.name === 'AuthTokenError') {
      return reply.redirect('water/update-password/update_password');
    }
    reply(error);
  }
}

/**
 * Reset successful
 * @param {Object} request - HAPI HTTP request
 * @param {Object} reply - HAPI HTTP reply interface
 */
async function getPasswordUpdated (request, reply) {
  return reply.view('water/update-password/updated_password', request.view);
}

module.exports = {
  getConfirmPassword,
  postConfirmPassword,
  postSetPassword,
  getPasswordUpdated
};
