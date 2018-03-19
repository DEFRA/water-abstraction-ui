const IDM = require('../../lib/connectors/idm');
const { UserNotFoundError } = require('./errors');

const formatViewError = (error) => {
  if (!error.isJoi) {
    return error;
  }
  return error.details.reduce((memo, detail) => {
    memo[detail.path.join('_') + '_' + detail.type.split('.')[1]] = true;
    return memo;
  }, {});
};

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

async function postChangePassword (request, reply) {
  if (request.formError) {
    const viewErrors = formatViewError(request.formError);

    // Map view errors to existing view
    const mapped = {
      hasValidationErrors: true,
      passwordTooShort: viewErrors.password_min,
      passwordHasNoSymbol: viewErrors.password_symbol,
      passwordHasNoUpperCase: viewErrors.password_uppercase,
      passwordsDontMatch: viewErrors.confirmPassword_allowOnly,
      noConfirmPassword: viewErrors.confirmPassword_empty
    };

    // console.log(JSON.stringify(request.formError, null, 2));
    console.log(JSON.stringify(formatViewError(request.formError)));
    return reply.view('water/reset_password_change_password', {...request.view, errors: mapped });
  }
  reply('no form error!');
}
module.exports = {
  getResetPassword,
  postResetPassword,
  getResetSuccess,
  getChangePassword,
  postChangePassword
};
