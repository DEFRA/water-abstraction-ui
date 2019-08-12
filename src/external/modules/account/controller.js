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

/**
 * Renders account screen with options to change email/password
 */
const getAccount = async (request, h) => {
  const view = {
    ...request.view,
    userName: request.defra.userName
  };
  return h.view('nunjucks/account/entry.njk', view, { layout: false });
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
  return h.view('nunjucks/account/try-again-later.njk', view, { layout: false });
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
  return h.view('nunjucks/form-without-nav.njk', view, { layout: false });
};

const postEnterNewEmailForm = request => handleRequest(
  enterNewEmailForm(request, request.payload.data),
  request,
  enterNewEmailSchema,
  { abortEarly: true }
);

/**
 * POST - enter and confirm new email address
 */
const postEnterNewEmail = async (request, h) => {
  const { userId } = request.defra;

  const form = postEnterNewEmailForm(request);

  if (!form.isValid) {
    return getEnterNewEmail(request, h, form);
  }

  const { email } = getValues(form);

  try {
    await services.water
      .changeEmailAddress.postGenerateSecurityCode(userId, email);
  } catch (err) {
    if (isLockedHttpStatus(err)) {
      return h.redirect('/account/change-email/locked');
    }
    // Swallow 409 error - in the event of a conflict, the other user is
    // sent an email
    if (isConflictHttpStatus(err)) {
      throw err;
    }
  }

  return h.redirect('/account/change-email/verify-new-email');
};

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
    return h.view('nunjucks/account/verify.njk', view, { layout: false });
  } catch (err) {
    return h.redirect('/account/change-email/enter-new-email');
  }
};

const postVerifyEmailForm = request => handleRequest(
  verifyNewEmailForm(request, request.payload.data),
  request,
  verifyNewEmailSchema,
  { abortEarly: true }
);

const postVerifyEmail = async (request, h) => {
  const form = postVerifyEmailForm(request);

  if (!form.isValid) {
    return getVerifyEmail(request, h, form);
  }

  const { verificationCode } = getValues(form);

  try {
    const { userId } = request.defra;
    await services.water
      .changeEmailAddress.postSecurityCode(userId, verificationCode);
    return h.redirect('/account/change-email/success');
  } catch (err) {
    if (isErrorHttpStatus(err)) {
      return getVerifyEmail(request, h, verifyNewEmailApplyErrors(form, err.statusCode));
    }
    if (isLockedHttpStatus(err)) {
      return h.redirect('/account/change-email/locked');
    }
    throw err;
  }
};

const getSuccess = async (request, h) => {
  return h.view('nunjucks/account/success.njk', request.view, { layout: false });
};

const getTryAgainLater = async (request, h) => {
  return h.view('nunjucks/account/try-again-later.njk', request.view, { layout: false });
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
