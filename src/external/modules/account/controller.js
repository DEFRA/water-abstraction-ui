const { get } = require('lodash');

const {
  enterNewEmailForm,
  enterNewEmailSchema
} = require('./forms/enter-new-email');
const {
  verifyNewEmailForm,
  verifyNewEmailApplyErrors,
  verifyNewEmailSchema
} = require('./forms/verify-new-email');

const { handleRequest, getValues } = require('shared/lib/forms');
const services = require('external/lib/connectors/services');

const isLockedHttpStatus = err => [423, 429].includes(err.statusCode);
const isErrorHttpStatus = err => [401, 404].includes(err.statusCode);
const isConflictHttpStatus = err => err.statusCode === 409;

// this comment should be removed - testing sonarcloud
const functionThatDoesntDoAnything = () => {
  const test = 'test';
  console.log(test);
  return '1';
};

exports.functionThatDoesntDoAnything = functionThatDoesntDoAnything;

/**
 * Renders account screen with options to change email/password
 */
const getAccount = async (request, h) => {
  const view = {
    ...request.view,
    userName: request.defra.userName
  };
  return h.view('nunjucks/account/entry', view);
};

/**
 * Start page for email address change flow.
 * If there is an unverified outstanding email change, then the user is
 * redirected to the security code page.  Otherwise, they are redirected
 * to the start of the flow
 */
const getChangeEmail = async (request, h) => {
  const { userId } = request.defra;
  try {
    const response = await services.water
      .changeEmailAddress.getStatus(userId);

    if (response.data.isLocked) {
      return h.redirect('/account/change-email/locked');
    }
    return h.redirect('/account/change-email/verify-new-email');
  } catch (err) {
    if (err.statusCode !== 404) {
      throw err;
    }
  }
  return h.redirect(`/account/change-email/enter-new-email`);
};

/**
 * Displays a locked page since the user can't progress with the flow
 * until tomorrow.
 * This occurs when rate limits are exceeded or the email change request is
 * already verified
 */
const getChangeEmailLocked = async (request, h) => {
  const view = {
    ...request.view,
    back: '/account'
  };
  return h.view('nunjucks/account/try-again-later', view);
};

/**
 * GET - enter and confirm new email address
 */
const getEnterNewEmail = async (request, h, form) => {
  const emailForm = form || enterNewEmailForm(request);
  const view = {
    ...request.view,
    form: emailForm,
    back: '/account'
  };
  return h.view('nunjucks/form-without-nav', view);
};

const postEnterNewEmailAPIRequest = async (userId, email) => {
  try {
    await services.water
      .changeEmailAddress.postGenerateSecurityCode(userId, email);
  } catch (err) {
    if (isLockedHttpStatus(err)) {
      return 'locked';
    }
    // Swallow on conflict status - the new user is sent an email
    // Throw other errors
    if (!isConflictHttpStatus(err)) {
      throw err;
    }
  }
  return 'redirect';
};

/**
 * POST - enter and confirm new email address
 */
const postEnterNewEmail = async (request, h) => {
  const form = handleRequest(
    enterNewEmailForm(request, request.payload.data),
    request,
    enterNewEmailSchema,
    { abortEarly: true }
  );

  if (!form.isValid) {
    return getEnterNewEmail(request, h, form);
  }

  const actions = {
    redirect: () => h.redirect('/account/change-email/verify-new-email'),
    locked: () => h.redirect('/account/change-email/locked')
  };

  const { email } = getValues(form);
  const { userId } = request.defra;

  const action = await postEnterNewEmailAPIRequest(userId, email);

  return actions[action]();
};

/**
 * GET - verify new email address with security code
 */
const getVerifyEmail = async (request, h, form) => {
  const { userId } = request.defra;

  try {
    const response = await services.water
      .changeEmailAddress.getStatus(userId);

    const verifyForm = form || verifyNewEmailForm(request);
    const view = {
      ...request.view,
      form: verifyForm,
      back: '/account',
      newEmail: get(response, 'data.email')
    };
    return h.view('nunjucks/account/verify', view);
  } catch (err) {
    return h.redirect('/account/change-email/enter-new-email');
  }
};

/**
 * Performs the water API request to verify email address with security code
 * and resolves with one of 3 known statuses, or throws an error
 * @param  {Number}  userId       - idm.users ID
 * @param  {String}  securityCode - 6 digit code
 * @return {Promise<String>}        status
 */
const postVerifyEmailAPIRequest = async (userId, securityCode) => {
  try {
    await services.water
      .changeEmailAddress.postSecurityCode(userId, securityCode);
    return 'redirect';
  } catch (err) {
    if (isErrorHttpStatus(err)) {
      return 'formError';
    }
    if (isLockedHttpStatus(err)) {
      return 'locked';
    }
    throw err;
  }
};

/**
 * POST - verify new email address with security code
 */
const postVerifyEmail = async (request, h) => {
  const form = handleRequest(
    verifyNewEmailForm(request, request.payload.data),
    request,
    verifyNewEmailSchema,
    { abortEarly: true }
  );

  if (!form.isValid) {
    return getVerifyEmail(request, h, form);
  }

  const actions = {
    redirect: () => h.redirect('/account/change-email/success'),
    formError: () => getVerifyEmail(request, h, verifyNewEmailApplyErrors(form)),
    locked: () => h.redirect('/account/change-email/locked')
  };

  const { userId } = request.defra;
  const { verificationCode } = getValues(form);

  const action = await postVerifyEmailAPIRequest(userId, verificationCode);

  return actions[action]();
};

const getSuccess = async (request, h) => {
  return h.view('nunjucks/account/success', request.view);
};

const getTryAgainLater = async (request, h) => {
  return h.view('nunjucks/account/try-again-later', request.view);
};

exports.getAccount = getAccount;
exports.getChangeEmail = getChangeEmail;
exports.getChangeEmailLocked = getChangeEmailLocked;
exports.getEnterNewEmail = getEnterNewEmail;
exports.postEnterNewEmail = postEnterNewEmail;
exports.getVerifyEmail = getVerifyEmail;
exports.postVerifyEmail = postVerifyEmail;
exports.getSuccess = getSuccess;
exports.getTryAgainLater = getTryAgainLater;
