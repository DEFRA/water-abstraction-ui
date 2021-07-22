const Joi = require('joi');
const { UserNotFoundError } = require('./errors');

const { handleRequest, applyErrors } = require('shared/lib/forms');
const { resetForm, resetFormSchema } = require('./forms/reset');
const { changePasswordForm, changePasswordFormSchema } = require('./forms/change-password');

const getResetPassword = (request, h, form) => {
  const thisForm = form || resetForm(request, h);
  const { error: queryParamError, value: queryParamValue } = Joi.string().allow('resetLinkExpired', null, '').validate(request.query.flash);

  let thisFormWithCustomErrors = thisForm;
  if (!queryParamError && queryParamValue === 'resetLinkExpired') {
    thisFormWithCustomErrors = applyErrors(thisForm, [
      { name: 'email', summary: 'This password reset link has expired. Please enter your email address below and we will send you a new one.' }
    ]);
  }

  const view = {
    ...request.view,
    form: thisFormWithCustomErrors
  };

  return h.view('nunjucks/form', view);
};

async function postResetPassword (request, h) {
  const baseForm = resetForm(request, h);
  const form = handleRequest(
    baseForm,
    request,
    resetFormSchema
  );
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
  return h.redirect(`/reset_password_check_email`);
}

async function getResetSuccess (request, h) {
  return h.view(request.config.view, request.view);
}

async function getChangePassword (request, h, form) {
  try {
    // Check for valid reset GUID
    const user = await h.realm.pluginOptions.getUserByResetGuid(request.query.resetGuid);
    if (!user) {
      throw new UserNotFoundError();
    }
    const thisForm = form || changePasswordForm(request, h);

    let thisFormWithCustomErrors = thisForm;

    const view = {
      ...request.view,
      form: thisFormWithCustomErrors
    };

    return h.view('nunjucks/form', view);
  } catch (error) {
    console.log(error);
    return h.redirect('/reset_password?flash=resetLinkExpired');
  }
}

async function postChangePassword (request, h) {
  try {
    const user = await h.realm.pluginOptions.getUserByResetGuid(request.payload.resetGuid);
    if (!user) {
      throw new UserNotFoundError();
    }
    const baseForm = changePasswordForm(request, h);
    const form = handleRequest(
      baseForm,
      request,
      changePasswordFormSchema
    );

    const thisForm = form || changePasswordForm(request, h);

    if (!thisForm.isValid) {
      return getResetPassword(request, h, thisForm);
    } else {
      const { password, confirmPassword } = request.payload || {};
      if (password !== confirmPassword) {
        let thisFormWithCustomErrors = thisForm;
        thisFormWithCustomErrors = applyErrors(thisForm, [
          { name: 'confirmPassword', summary: 'Passwords must match' }
        ]);
        thisFormWithCustomErrors.isValid = false;
        return getResetPassword(request, h, thisFormWithCustomErrors);
      } else {
        try {
          await h.realm.pluginOptions.resetPassword(request.payload.email);
        } catch (error) {
          // Note: we don't do anything differently as we don't wish to reveal if
          // account exists
          request.log('debug', 'Reset password error', { error });
        }
      }
    }

    // Validation OK - update password in IDM
    const { error } = await h.realm.pluginOptions.updatePasswordWithGuid(request.payload.resetGuid, request.payload.password);
    if (error) {
      throw error;
    }

    return request.logIn(user);
  } catch (error) {
    console.log(error);
    return h.redirect('/reset_password?flash=resetLinkExpired');
  }
}

exports.getResetPassword = getResetPassword;
exports.postResetPassword = postResetPassword;
exports.getResetSuccess = getResetSuccess;
exports.getChangePassword = getChangePassword;
exports.postChangePassword = postChangePassword;
