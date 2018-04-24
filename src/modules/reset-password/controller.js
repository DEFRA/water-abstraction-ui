const IDM = require('../../lib/connectors/idm');
const { UserNotFoundError } = require('./errors');
const signIn = require('../../lib/sign-in');
const mapJoiPasswordError = require('./map-joi-password-error');

/**
 * Renders form for start of reset password flow
 * @param {Object} request - HAPI HTTP request
 * @param {Object} reply - HAPI HTTP reply interface
 */
async function getResetPassword (request, reply) {
  return reply.view(request.config.view, request.view);
}

/**
 * Post handler for reset password flow
 * @param {Object} request - HAPI HTTP request
 * @param {String} request.payload.email_address - email address for IDM account
 * @param {Object} reply - HAPI HTTP reply interface
 */
async function postResetPassword (request, reply) {
  if (request.formError) {
    return reply.view(request.config.view, { ...request.view, error: request.formError });
  }
  try {
    await IDM.resetPassword(request.payload.email_address);
  } catch (error) {
    console.log(error);
    // Note: we don't do anything differently as we don't wish to reveal if
    // account exists
  }
  return reply.redirect(request.config.redirect);
}

/**
 * Success page for reset password flow
 * @param {Object} request - HAPI HTTP request
 * @param {Object} reply - HAPI HTTP reply interface
 */
async function getResetSuccess (request, reply) {
  return reply.view(request.config.view, request.view);
}

/**
 * Reset password form - requires valid GUID
 * @param {Object} request - HAPI HTTP request
 * @param {String} request.query.resetGuid - reset GUID sent via email
 * @param {Object} reply - HAPI HTTP reply interface
 */
async function getChangePassword (request, reply) {
  try {
    // Check for valid reset GUID
    const user = await IDM.getUserByResetGuid(request.query.resetGuid);
    if (!user) {
      throw new UserNotFoundError();
    }
    return reply.view('water/reset-password/reset_password_change_password', request.view);
  } catch (error) {
    return reply.redirect('/reset_password?flash=resetLinkExpired');
  }
}

/**
 * Reset password - POST handler
 * @param {Object} request - HAPI HTTP request
 * @param {String} [request.query.resetGuid] - reset GUID sent via email - if initial render
 * @param {String} [request.payload.resetGuid] - reset GUID sent via email - if resubmitting
 * @param {String} request.query.password - new password
 * @param {String} request.query.confirmPassword - new password again
 * @param {Object} reply - HAPI HTTP reply interface
 */
async function postChangePassword (request, reply) {
  try {
    // Check for valid reset GUID
    const user = await IDM.getUserByResetGuid(request.payload.resetGuid);
    if (!user) {
      throw new UserNotFoundError();
    }

    // Check for form errors
    if (request.formError) {
      const errors = mapJoiPasswordError(request.formError);
      return reply.view('water/reset-password/reset_password_change_password', { ...request.view, errors });
    }

    // Validation OK - update password in IDM
    const { error } = await IDM.updatePasswordWithGuid(request.payload.resetGuid, request.payload.password);
    if (error) {
      throw error;
    }

    // Log user in
    await signIn.auto(request, user.user_name);

    reply.redirect('/licences');
  } catch (error) {
    return reply.redirect('/reset_password?flash=resetLinkExpired');
  }
}

module.exports = {
  getResetPassword,
  postResetPassword,
  getResetSuccess,
  getChangePassword,
  postChangePassword
};
