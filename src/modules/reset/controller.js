const IDM = require('../../lib/connectors/idm');

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
 * Initial success page for reset password flow
 */
function getResetSuccess (request, reply) {
  return reply.view(request.config.view, request.view);
}

module.exports = {
  getResetPassword,
  postResetPassword,
  getResetSuccess
};
