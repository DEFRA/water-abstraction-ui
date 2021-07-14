const { UserNotFoundError } = require('./errors');
const mapJoiPasswordError = require('./map-joi-password-error.js');
const { handleRequest } = require('../../lib/forms');
const { resetForm, resetSchema } = require('./forms/reset');

/**
 * Renders form for start of reset password flow
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - HAPI HTTP h interface
 */
async function getResetPassword (request, h, form) {
  const view = {
    ...request.view,
    form: form || resetForm(request.path),
    linkExpired: request.query.flash === 'resetLinkExpired'
  };
  return h.view(request.config.view, view);
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
    request.log('debug', 'Reset password error', { error });
  }
  return h.redirect(request.config.redirect);
}

/**
 * Success page for reset password flow
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - HAPI HTTP h interface
 */
async function getResetSuccess (request, h) {
  return h.view(request.config.view, request.view);
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
    return h.view('nunjucks/reset-password/change-password', request.view);
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
    console.log(1111);
    // Check for valid reset GUID
    const user = await h.realm.pluginOptions.getUserByResetGuid(request.payload.resetGuid);
    console.log(222);
    if (!user) {
      throw new UserNotFoundError();
    }
    console.log(333);
    // Check for form errors
    console.log(request.formError);
    if (request.formError) {
      console.log(555);
      const errors = mapJoiPasswordError(request.formError);
      console.log(errors);
      return h.view('nunjucks/reset-password/change-password', {
        ...request.view, errors
      });
    }
    console.log(76776);
    // Validation OK - update password in IDM
    const { error } = await h.realm.pluginOptions.updatePasswordWithGuid(request.payload.resetGuid, request.payload.password);
    console.log(117745745);
    if (error) {
      throw error;
    }
    console.log(189899);
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
