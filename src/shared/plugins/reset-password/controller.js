// const IDM = require('../../lib/connectors/idm');
const { UserNotFoundError } = require('./errors');
const mapJoiPasswordError = require('./map-joi-password-error.js');
const { handleRequest } = require('../../../shared/lib/forms');
const { resetForm, resetSchema } = require('./forms/reset');

/**
 * Renders form for start of reset password flow
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - HAPI HTTP h interface
 */
async function getResetPassword (request, h, form) {
  const view = {
    ...request.view,
    form: form || resetForm(request.path)
  };
  return h.view(request.config.view, view, { layout: false });
}

/**
 * Post handler for reset password flow
 * @param {Object} request - HAPI HTTP request
 * @param {String} request.payload.email_address - email address for IDM account
 * @param {Object} h - HAPI HTTP h interface
 */
async function postResetPassword (request, h) {
  const form = handleRequest(resetForm(request.path), request, resetSchema, { abortEarly: true });

  if (!form.isValid) {
    return getResetPassword(request, h, form);
  }

  try {
    await h.realm.pluginOptions.resetPassword(request.payload.email);
  } catch (error) {
    // Note: we don't do anything differently as we don't wish to reveal if
    // account exists
    request.log('error', 'Reset password error', { error });
  }
  return h.redirect(request.config.redirect);
}

/**
 * Success page for reset password flow
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - HAPI HTTP h interface
 */
async function getResetSuccess (request, h) {
  return h.view(request.config.view, request.view, { layout: false });
}

/**
 * Reset password form - requires valid GUID
 * @param {Object} request - HAPI HTTP request
 * @param {String} request.query.resetGuid - reset GUID sent via email
 * @param {Object} h - HAPI HTTP h interface
 */
async function getChangePassword (request, h) {
  try {
    // Check for valid reset GUID
    const user = await h.realm.pluginOptions.getUserByResetGuid(request.query.resetGuid);
    if (!user) {
      throw new UserNotFoundError();
    }
    return h.view('water/reset-password/reset_password_change_password', request.view);
  } catch (error) {
    return h.redirect('/reset_password?flash=resetLinkExpired');
  }
}

/**
 * Reset password - POST handler
 * @param {Object} request - HAPI HTTP request
 * @param {String} [request.query.resetGuid] - reset GUID sent via email - if initial render
 * @param {String} [request.payload.resetGuid] - reset GUID sent via email - if resubmitting
 * @param {String} request.query.password - new password
 * @param {String} request.query.confirmPassword - new password again
 * @param {Object} h - HAPI HTTP h interface
 */
async function postChangePassword (request, h) {
  try {
    // Check for valid reset GUID
    const user = await h.realm.pluginOptions.getUserByResetGuid(request.payload.resetGuid);
    if (!user) {
      throw new UserNotFoundError();
    }

    // Check for form errors
    if (request.formError) {
      const errors = mapJoiPasswordError(request.formError);
      return h.view('water/reset-password/reset_password_change_password', { ...request.view, errors });
    }

    // Validation OK - update password in IDM
    const { error } = await h.realm.pluginOptions.updatePasswordWithGuid(request.payload.resetGuid, request.payload.password);
    if (error) {
      throw error;
    }

    // Log user in
    return request.logIn(user);
  } catch (error) {
    return h.redirect('/reset_password?flash=resetLinkExpired');
  }
}

exports.getResetPassword = getResetPassword;
exports.postResetPassword = postResetPassword;
exports.getResetSuccess = getResetSuccess;
exports.getChangePassword = getChangePassword;
exports.postChangePassword = postChangePassword;
