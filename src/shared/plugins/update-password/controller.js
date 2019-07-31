const uuid = require('uuid/v4');
const mapJoiPasswordError = require('shared/plugins/reset-password/map-joi-password-error');
const { AuthTokenError } = require('./errors');

/**
 * Update password step 1 - enter current password
 */
const getConfirmPassword = async (request, h) => h.view(
  'nunjucks/update-password/enter-current.njk',
  {
    ...request.view,
    pageTitle: 'Enter your current password'
  },
  { layout: false }
);

/**
 * Update password step 1 POST handler - enter current password
 * @param {Object} request - HAPI HTTP request
 * @param {String} request.payload.password - user's current password in IDM
 * @param {Object} h - HAPI HTTP reply interface
 */
async function postConfirmPassword (request, h) {
  try {
    if (request.formError) {
      throw request.formError;
    }
    const { password } = request.payload;
    const { userName } = request.defra;

    const authResponse = await h.realm.pluginOptions.authenticate(userName, password);

    if (authResponse) {
      // Create auth token to verify user in subsequent page in flow
      const authtoken = uuid();
      request.yar.set('authToken', authtoken);

      return h.view(
        'nunjucks/update-password/enter-new.njk',
        { authtoken, ...request.view },
        { layout: false }
      );
    }

    request.view.errors = true;
    return getConfirmPassword(request, h);
  } catch (error) {
    request.view.error = error;
    request.view.errors = true;
    return getConfirmPassword(request, h);
  }
}

/**
 * Reset password form handler for signed-in user
 * @todo consider Joi for password validation
 * @param {String} request.payload.password - new password
 * @param {String} request.payload.confirmPassword - password again
 * @param {String} request.payload.authtoken - token to ensure user verified identity in previous step in flow
 */
async function postSetPassword (request, h) {
  // Form validation error
  if (request.formError) {
    const errors = mapJoiPasswordError(request.formError);
    const { authtoken } = request.payload;
    return h.view(
      'nunjucks/update-password/enter-new.njk',
      { ...request.view, errors, authtoken },
      { layout: false }
    );
  }

  try {
    // Check auth token
    const { authtoken, password } = request.payload;
    if (authtoken !== request.yar.get('authToken')) {
      throw new AuthTokenError();
    }
    // Change password
    const { userId } = request.defra;
    const { error } = await h.realm.pluginOptions.updatePassword(userId, password);
    if (error) {
      throw error;
    }

    // All OK
    return h.redirect('/account/update-password/success');
  } catch (error) {
    return handlePostSetPasswordError(error, h);
  }
}
/**
 * Handle error thrown by postSetPassword method
 * @param  {Object} error
 * @param  {Object} h     HAPI HTTP reply interface
 */
const handlePostSetPasswordError = (error, h) => {
  if (error.name === 'AuthTokenError') {
    return h.redirect('/account/update-password');
  }
  return h(error);
};

/**
 * Reset successful
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - HAPI HTTP reply interface
 */
const getPasswordUpdated = async (request, h) => h.view(
  'nunjucks/update-password/success.njk',
  request.view,
  { layout: false }
);

exports.getConfirmPassword = getConfirmPassword;
exports.postConfirmPassword = postConfirmPassword;
exports.postSetPassword = postSetPassword;
exports.getPasswordUpdated = getPasswordUpdated;
