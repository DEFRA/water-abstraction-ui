/**
 * HAPI Route handlers for registering a user account
 * @module controllers/registration
 */
const Joi = require('joi');
const querystring = require('querystring');
const config = require('../../config');
const services = require('../../lib/connectors/services');

/**
 * Render initial page with information for users
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - Hapi Response Toolkit
 */
const getRegisterStart = (request, h) => h.view(
  'nunjucks/registration/start.njk',
  request.view,
  { layout: false }
);

/**
 * Render form to get user email address
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - Hapi Response Toolkit
 */
const getEmailAddress = (request, h) => h.view(
  'nunjucks/registration/enter-email.njk',
  request.view,
  { layout: false }
);

const getUrlWithEmailParam = (email, options) => {
  if (options.includeEmail) {
    const query = querystring.stringify({ email });
    return `${options.redirect}?${query}`;
  }
  return options.redirect;
};

const validateEmail = requestPayload => {
  const { error, value } = Joi.validate(requestPayload, {
    email: Joi.string().trim().required().email().lowercase()
  });

  if (error) {
    throw error;
  }
  return value.email;
};

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
const postEmailAddress = async (request, h, options = {}) => {
  const defaults = {
    template: 'nunjucks/registration/enter-email.njk',
    redirect: '/success',
    includeEmail: true
  };
  const emailConfig = Object.assign(defaults, options);
  let email;

  try {
    // Validate email
    email = validateEmail(request.payload);

    // Try to create user
    const { error: createError } = await services.idm.users.createUserWithoutPassword(config.idm.application, email);

    if (createError) {
      throw createError;
    }

    await services.idm.users.resetPassword(config.idm.application, email, 'new');
    return h.redirect(getUrlWithEmailParam(email, emailConfig));
  } catch (error) {
    // User exists
    if (error.name === 'DBError' && parseInt(error.code, 10) === 23505) {
      const { error: resetError } = await services.idm.users.resetPassword(config.idm.application, request.payload.email, 'existing');
      if (resetError) {
        throw resetError;
      }
      return h.redirect(getUrlWithEmailParam(email, emailConfig));
    }

    // Email was invalid - handle error
    if (error.name === 'ValidationError') {
      request.view.error = error;
      return h.view(emailConfig.template, request.view, { layout: false });
    }

    throw error;
  }
};

/**
 * Success page shown when account created
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - Hapi Response Toolkit
 */
const getRegisterSuccess = (request, h) => h.view(
  'nunjucks/registration/email-sent.njk',
  {
    ...request.view,
    email: request.query.email
  },
  { layout: false }
);

/**
 * Try sending email again
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - Hapi Response Toolkit
 */
const getSendAgain = (request, h) => h.view(
  'nunjucks/registration/email-resend.njk',
  request.view,
  { layout: false }
);

/**
 * Send email again
 * @param {Object} request - HAPI HTTP request
 * @param {String} request.payload.email - email address for user account
 * @param {Object} h - Hapi Response Toolkit
 */
const postSendAgain = (request, h) => {
  const options = {
    template: 'nunjucks/registration/email-resend.njk',
    redirect: '/resent-success',
    includeEmail: false
  };
  return postEmailAddress(request, h, options);
};

/**
 * Success page shown when account created
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - Hapi Response Toolkit
 */
const getResentSuccess = (request, h) => h.view(
  'nunjucks/registration/email-resent.njk',
  request.view,
  { layout: false }
);

exports.getRegisterStart = getRegisterStart;
exports.getEmailAddress = getEmailAddress;
exports.postEmailAddress = postEmailAddress;
exports.getRegisterSuccess = getRegisterSuccess;
exports.getSendAgain = getSendAgain;
exports.postSendAgain = postSendAgain;
exports.getResentSuccess = getResentSuccess;
exports.getUrlWithEmailParam = getUrlWithEmailParam;
