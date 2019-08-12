const { setValues, getValues, handleRequest } = require('shared/lib/forms');
const { confirmPasswordForm, confirmPasswordSchema, confirmPasswordApplyErrors } =
  require('./forms/confirm-password');
const helpers = require('./lib/helpers');

/**
 * Renders  a confirm password form
 */
const getConfirmPassword = async (request, h, form) => {
  const view = {
    ...request.view,
    form: form || confirmPasswordForm(request),
    back: '/account'
  };
  return h.view('nunjucks/form-without-nav.njk', view, { layout: false });
};

const isLockedHttpStatus = err => err.statusCode === 429;
const isErrorHttpStatus = err => err.statusCode === 401;

/**
 * Post handler
 * Interacts with reauthenticate feature in IDM
 */
const postConfirmPassword = async (request, h) => {
  const form = handleRequest(
    setValues(confirmPasswordForm(request), request.payload),
    request, confirmPasswordSchema, { abortEarly: true }
  );

  if (!form.isValid) {
    return getConfirmPassword(request, h, form);
  }

  const { userId } = request.defra;
  const { password } = getValues(form);

  try {
    const { reauthenticate } = h.realm.pluginOptions;
    await reauthenticate(userId, password);

    // Set session data
    request.yar.set('reauthExpiryTime', helpers.getExpiryTime());

    // Redirect to original requested path
    const path = request.yar.get('reauthRedirectPath');
    return h.redirect(path);
  } catch (err) {
    if (isLockedHttpStatus(err)) {
      return h.redirect('/confirm-password/locked');
    }
    if (isErrorHttpStatus(err)) {
      return getConfirmPassword(request, h, confirmPasswordApplyErrors(form, err.statusCode));
    }
    throw err;
  }
};

/**
 * Renders  a confirm password form
 */
const getPasswordLocked = async (request, h, form) => {
  const view = {
    ...request.view,
    back: '/account'
  };
  return h.view('nunjucks/reauth/try-again-later.njk', view, { layout: false });
};

exports.getConfirmPassword = getConfirmPassword;
exports.postConfirmPassword = postConfirmPassword;
exports.getPasswordLocked = getPasswordLocked;
