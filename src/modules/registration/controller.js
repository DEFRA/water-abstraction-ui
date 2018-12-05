/**
 * HAPI Route handlers for registering a user account
 * @module controllers/registration
 */
const Joi = require('joi');
const IDM = require('../../lib/connectors/idm');

/**
 * Render initial page with information for users
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - Hapi Response Toolkit
 */
function getRegisterStart (request, h) {
  return h.view('water/registration/register_start', request.view);
}

/**
 * Render form to get user email address
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - Hapi Response Toolkit
 */
function getEmailAddress (request, h) {
  return h.view('water/registration/register_email', request.view);
}

/**
 * Process email form
 * - validates email address
 * - creates user in IDM
 * - @TODO send notify email depending on whether last_login is null
 * - @TODO send password reset email
 *
 * @param {Object} request - HAPI HTTP request
 * @param {Object} request.payload - form post data
 * @param {String} request.payload.email - email address for user account
 * @param {Object} h - Hapi Response Toolkit
 */
async function postEmailAddress (request, h, options = {}) {
  const defaults = {
    template: 'water/registration/register_email',
    redirect: '/success'
  };
  const config = Object.assign(defaults, options);
  const pageTitle = config.template === 'water/registration/register_email' ? 'Tell us your email address' : 'Ask for another email';

  try {
    // Validate email
    const { error, value } = Joi.validate(request.payload, {
      email: Joi.string().trim().required().email().lowercase()
    });

    if (error) {
      throw error;
    }

    // Try to create user
    const { error: createError } = await IDM.createUserWithoutPassword(value.email);

    if (createError) {
      throw createError;
    }

    await IDM.resetPassword(value.email, 'new');
    return h.redirect(config.redirect);
  } catch (error) {
    // User exists
    if (error.name === 'DBError' && parseInt(error.code, 10) === 23505) {
      const { error: resetError } = await IDM.resetPassword(request.payload.email, 'existing');
      if (resetError) {
        throw resetError;
      } else {
        return h.redirect(config.redirect);
      }
    }

    // Email was invalid - handle error
    if (error.name === 'ValidationError') {
      request.view.pageTitle = pageTitle;
      request.view.error = error;
      return h.view(config.template, request.view);
    }

    throw error;
  }
}

/**
 * Success page shown when account created
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - Hapi Response Toolkit
 */
function getRegisterSuccess (request, h) {
  return h.view('water/registration/register_success', request.view);
}

/**
 * Try sending email again
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - Hapi Response Toolkit
 */
function getSendAgain (request, h) {
  return h.view('water/registration/register_send_again', request.view);
}

/**
 * Send email again
 * @param {Object} request - HAPI HTTP request
 * @param {String} request.payload.email - email address for user account
 * @param {Object} h - Hapi Response Toolkit
 */
function postSendAgain (request, h) {
  const options = {
    template: 'water/registration/register_send_again',
    redirect: '/resent-success'
  };
  return postEmailAddress(request, h, options);
}

/**
 * Success page shown when account created
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - Hapi Response Toolkit
 */
function getResentSuccess (request, h) {
  request.view.pageTitle = 'Confirm your email address';
  return h.view('water/registration/register_resent_success', request.view);
}

module.exports = {
  getRegisterStart,
  getEmailAddress,
  postEmailAddress,
  getRegisterSuccess,
  getSendAgain,
  postSendAgain,
  getResentSuccess
};
