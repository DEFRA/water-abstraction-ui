const mapJoiPasswordError = require('shared/plugins/reset-password/map-joi-password-error');

/**
 * Update password - enter current password
 */
const getConfirmPassword = async (request, h) => {
  return h.view(
    'nunjucks/update-password/enter-new.njk',
    { ...request.view },
    { layout: false }
  );
};

/**
 * Update password form handler for signed-in user
 * @todo consider Joi for password validation
 * @param {String} request.payload.password - new password
 * @param {String} request.payload.confirmPassword - password again
 */
async function postSetPassword (request, h) {
  // Form validation error
  if (request.formError) {
    const errors = mapJoiPasswordError(request.formError);
    return h.view(
      'nunjucks/update-password/enter-new.njk',
      { ...request.view, errors },
      { layout: false }
    );
  }

  try {
    const { password } = request.payload;
    // Change password in database
    const { userId } = request.defra;
    const { error } = await h.realm.pluginOptions.updatePassword(userId, password);
    if (error) {
      throw error;
    }
    // All OK
    return h.redirect('/account/update-password/success');
  } catch (error) {
    return h(error);
  }
}

/**
 * Update successful
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - HAPI HTTP reply interface
 */
const getPasswordUpdated = async (request, h) => h.view(
  'nunjucks/update-password/success.njk',
  request.view,
  { layout: false }
);

exports.getConfirmPassword = getConfirmPassword;
exports.postSetPassword = postSetPassword;
exports.getPasswordUpdated = getPasswordUpdated;
