/**
 * HAPI Route handlers for registering a user account
 * @module controllers/registration
 */
const Boom = require('boom');
const Joi = require('joi');
const errorHandler = require('../lib/error-handler');
const View = require('../lib/view');
const joiPromise = require('../lib/joi-promise');
const IDM = require('../lib/connectors/idm');
const Notify = require('../lib/connectors/notify');
const CRM = require('../lib/connectors/crm');

/**
 * Render form to get user email address
 * @param {Object} request - HAPI HTTP request
 * @param {Object} reply - HAPI HTTP reply
 */
function getEmailAddress(request, reply) {
  var viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'GOV.UK - Create Account';
  return reply.view('water/register_email', viewContext);
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
 * @param {Object} reply - HAPI HTTP reply
 */
async function postEmailAddress(request, reply, options = {}) {

  const defaults = {
    template : 'water/register_email',
    redirect : '/success'
  };
  const config = Object.assign(defaults, options);

  const _sendNotifyEmail = (user) => {
    const {reset_guid, user_name, last_login} = user;
    if(last_login) {
      return Notify.sendExistingUserPasswordReset(user_name, reset_guid);
    }
    else {
      return Notify.sendNewUserPasswordReset(user_name, reset_guid);
    }
  }

  try {

    // Validate email
    const {error, value} = Joi.validate(request.payload, {
      email : Joi.string().trim().required().email().lowercase()
    });

    if(error) {
      throw error;
    }

    // Try to create user
    const {error : createError, data} = await IDM.createUserWithoutPassword(value.email);

    if(createError) {
      throw createError;
    }

    await _sendNotifyEmail(data);
    return reply.redirect(config.redirect);

  }
  catch(error) {

    // User exists
    if(error.name == 'DBError' && error.code == 23505) {
      console.log(`User ${request.payload.email} already exists, resetting password`)
      const {data, error : resetError, rowCount} = await IDM.resetPasswordQuiet(request.payload.email);
      if(!resetError) {
        await _sendNotifyEmail(data);
        return reply.redirect(config.redirect)
      }
    }

    // Email was invalid - handle error
    if(error.name === 'ValidationError') {
      var viewContext = View.contextDefaults(request);
      viewContext.pageTitle = 'GOV.UK - Create Account';
      viewContext.error = error;
      return reply.view(config.template, viewContext);
    }

    errorHandler(request,reply)(error);
  }

  //
  // joiPromise(request.payload, schema)
  //   .then((result) => {
  //     return IDM.createUserWithoutPassword(result.email);
  //   })
  //   .then((response) => {
  //     if(response.error) {
  //       throw Boom.badImplementation('IDM error', response.error);
  //     }
  //
  //     // Reset user password - user now exists
  //     return IDM.resetPasswordQuiet(request.payload.email);
  //   })
  //   .then((res) => {
  //     // Email them password reset guid
  //     return _sendNotifyEmail(res);
  //   })
  //   .then((res) => {
  //     // Redirect to success page
  //     return reply.redirect(config.redirect);
  //   })
  //   .catch((error) => {
  //
  //     // User already exists - handle error
  //     if(error.isBoom && error.data.code && (error.data.code == 23505)) {
  //       return IDM.resetPasswordQuiet(request.payload.email)
  //         .then((res) => {
  //           return _sendNotifyEmail(res);
  //         })
  //         .then(() => {
  //           // Redirect to success page
  //           return reply.redirect(config.redirect)
  //         });
  //     }
  //
  //     // Email was invalid - handle error
  //     if(error.name === 'ValidationError') {
  //       var viewContext = View.contextDefaults(request);
  //       viewContext.pageTitle = 'GOV.UK - Create Account';
  //       viewContext.error = error;
  //       return reply.view(config.template, viewContext);
  //     }
  //     throw error;
  //   })
  //   .catch(errorHandler(request,reply));


}


/**
 * Success page shown when account created
 * @param {Object} request - HAPI HTTP request
 * @param {Object} reply - HAPI HTTP reply
 */
function getRegisterSuccess(request, reply) {
  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'GOV.UK - Account Created';
  return reply.view('water/register_success', viewContext);
}

/**
 * Try sending email again
 * @param {Object} request - HAPI HTTP request
 * @param {Object} reply - HAPI HTTP reply
 */
function getSendAgain(request, reply) {
  var viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'GOV.UK - Resend Email';
  return reply.view('water/register_send_again', viewContext);
}

/**
 * Send email again
 * @param {Object} request - HAPI HTTP request
 * @param {String} request.payload.email - email address for user account
 * @param {Object} reply - HAPI HTTP reply
 */
function postSendAgain(request, reply) {
  const options = {
    template: 'water/register_send_again',
    redirect: '/resent-success'
  };
  postEmailAddress(request, reply, options);
}


/**
 * Success page shown when account created
 * @param {Object} request - HAPI HTTP request
 * @param {Object} reply - HAPI HTTP reply
 */
function getResentSuccess(request, reply) {
  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'GOV.UK - Account Created';
  return reply.view('water/register_resent_success', viewContext);
}

module.exports = {
  getEmailAddress,
  postEmailAddress,
  getRegisterSuccess,
  getSendAgain,
  postSendAgain,
  getResentSuccess
};
