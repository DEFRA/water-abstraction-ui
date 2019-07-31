const { confirmPasswordForm } = require('./forms/confirm-password');
const {
  enterNewEmailForm,
  enterNewEmailSchema
} = require('./forms/enter-new-email');
const { verifyNewEmailForm } = require('./forms/verify-new-email');

const { handleRequest, setValues } = require('shared/lib/forms');

const getAccount = async (request, h) => {
  const view = {
    ...request.view,
    userName: request.defra.userName
  };
  return h.view('nunjucks/account/entry.njk', view, { layout: false });
};

const getConfirmPassword = async (request, h, form) => {
  const passwordForm = form || confirmPasswordForm(request);
  const view = {
    ...request.view,
    form: passwordForm,
    back: '/account'
  };
  return h.view('nunjucks/form.njk', view, { layout: false });
};

const postConfirmPassword = async (request, h) => {
  const data = request.payload;
  const form = handleRequest(setValues(confirmPasswordForm(request), data), request);

  if (form.isValid) {
    return h.redirect('/account/change-email/enter-new-email');
  }

  return getConfirmPassword(request, h, form);
};

const getEnterNewEmail = async (request, h, form) => {
  const emailForm = form || enterNewEmailForm(request);
  const view = {
    ...request.view,
    form: emailForm,
    back: '/account'
  };
  return h.view('nunjucks/form.njk', view, { layout: false });
};

const postEnterNewEmail = async (request, h) => {
  const data = request.payload;
  const form = handleRequest(
    enterNewEmailForm(request, data),
    request,
    enterNewEmailSchema
  );

  if (form.isValid) {
    return h.redirect('/account/change-email/verify-new-email');
  }

  return getEnterNewEmail(request, h, form);
};

const getVerifyEmail = async (request, h, form) => {
  const verifyForm = form || verifyNewEmailForm(request);
  const view = {
    ...request.view,
    form: verifyForm,
    back: '/account',
    newEmail: 'test@example.com'
  };
  return h.view('nunjucks/account/verify.njk', view, { layout: false });
};

const postVerifyEmail = async (request, h) => {
  const data = request.payload;
  const form = handleRequest(verifyNewEmailForm(request, data), request);

  if (form.isValid) {
    return h.redirect('/account/change-email/success');
  }

  return getVerifyEmail(request, h, form);
};

const getSuccess = async (request, h) => {
  return h.view('nunjucks/account/success.njk', request.view, { layout: false });
};

const getTryAgainLater = async (request, h) => {
  return h.view('nunjucks/account/try-again-later.njk', request.view, { layout: false });
};

exports.getAccount = getAccount;
exports.getConfirmPassword = getConfirmPassword;
exports.postConfirmPassword = postConfirmPassword;
exports.getEnterNewEmail = getEnterNewEmail;
exports.postEnterNewEmail = postEnterNewEmail;
exports.getVerifyEmail = getVerifyEmail;
exports.postVerifyEmail = postVerifyEmail;
exports.getSuccess = getSuccess;
exports.getTryAgainLater = getTryAgainLater;
