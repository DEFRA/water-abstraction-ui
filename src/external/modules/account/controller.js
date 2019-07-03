const { confirmPasswordForm } = require('./forms/confirm-password');
const { handleRequest, setValues } = require('shared/lib/forms');

const getAccount = async (request, h) => {
  const view = {
    ...request.view,
    userName: request.defra.userName
  };
  return h.view('nunjucks/account/entry.njk', view, { layout: false });
};

const getConfirmPassword = async (request, h, form) => {
  const passwordForm = confirmPasswordForm(request);
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

const getEnterNewEmail = () => 'Under construction';

exports.getAccount = getAccount;
exports.getConfirmPassword = getConfirmPassword;
exports.postConfirmPassword = postConfirmPassword;
exports.getEnterNewEmail = getEnterNewEmail;
