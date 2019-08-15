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

const postConfirmPasswordForm = request => handleRequest(
  setValues(confirmPasswordForm(request), request.payload),
  request,
  confirmPasswordSchema,
  { abortEarly: true }
);

const postConfirmPasswordAPIRequest = async (h, userId, password) => {
  const { reauthenticate } = h.realm.pluginOptions;
  try {
    await reauthenticate(userId, password);
    return 'authenticated';
  } catch (err) {
    if (isLockedHttpStatus(err)) {
      return 'locked';
    }
    if (isErrorHttpStatus(err)) {
      return 'formError';
    }
    throw err;
  }
};

/**
 * Post handler
 * Interacts with reauthenticate feature in IDM
 */
const postConfirmPassword = async (request, h) => {
  const form = postConfirmPasswordForm(request);

  if (!form.isValid) {
    return getConfirmPassword(request, h, form);
  }

  const { userId } = request.defra;
  const { password } = getValues(form);
  const action = await postConfirmPasswordAPIRequest(h, userId, password);

  const actions = {
    authenticated: () => {
      // Set session data
      request.yar.set('reauthExpiryTime', helpers.getExpiryTime());

      // Redirect to original requested path
      const path = request.yar.get('reauthRedirectPath');
      return h.redirect(path);
    },
    locked: () => h.redirect('/confirm-password/locked'),
    formError: () => getConfirmPassword(request, h, confirmPasswordApplyErrors(form))
  };

  return actions[action]();
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
