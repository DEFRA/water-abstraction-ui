const IDM = require('../../lib/connectors/idm');
const { UserNotFoundError } = require('./errors');
const { formatViewError } = require('../../lib/helpers');
const signIn = require('../../lib/sign-in');

/**
 * Renders form for reset password flow
 */
function getResetPassword (request, reply) {
  return reply.view(request.config.view, request.view);
}

/**
 * Post handler for reset password flow
 */
async function postResetPassword (request, reply) {
  if (request.formError) {
    return reply.view(request.config.view, {...request.view, error: request.formError});
  }
  await IDM.resetPassword(request.payload.email_address);
  return reply.redirect(request.config.redirect);
}

/**
 * Success page for reset password flow
 */
function getResetSuccess (request, reply) {
  return reply.view(request.config.view, request.view);
}

/**
 * Reset password form - requires valid GUID
 */
async function getChangePassword (request, reply) {
  try {
    // Check for valid reset GUID
    const user = await IDM.getUserByResetGuid(request.query.resetGuid);
    if (!user) {
      throw new UserNotFoundError();
    }
    return reply.view('water/reset_password_change_password', request.view);
  } catch (error) {
    return reply.redirect('/reset_password?flash=resetLinkExpired');
  }
}

/**
 * Map new-style error object to existing handlebars template
 * @param {Object} error - Joi error
 * @return {Object} error in format for existing change password template
 */
function mapJoiError (error) {
  const viewErrors = formatViewError(error);

  return {
    hasValidationErrors: true,
    passwordTooShort: viewErrors.password_min,
    passwordHasNoSymbol: viewErrors.password_symbol,
    passwordHasNoUpperCase: viewErrors.password_uppercase,
    passwordsDontMatch: !viewErrors.confirmPassword_empty && viewErrors.confirmPassword_allowOnly,
    noConfirmPassword: viewErrors.confirmPassword_empty
  };
}

/**
 * Reset password - POST handler
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
      const errors = mapJoiError(request.formError);
      return reply.view('water/reset_password_change_password', { ...request.view, errors });
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
    console.log(error);
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
