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
 * - @TODO send password reset email
 * - @TODO create CRM entity
 *
 * @param {Object} request - HAPI HTTP request
 * @param {Object} request.payload - form post data
 * @param {String} request.payload.email - email address for user account
 * @param {Object} reply - HAPI HTTP reply
 */
function postEmailAddress(request, reply) {
  // Validate input data with Joi
  const schema = {
    email : Joi.string().trim().required().email()
  };
  joiPromise(request.payload, schema)
    .then((result) => {
      return IDM.createUserWithoutPassword(result.email);
    })
    .then((response) => {
      if(response.error) {
        throw Boom.badImplementation('IDM error', response.error);
      }
      // Trigger password reset email
      return IDM.resetPassword(request.payload.email);
    })
    .then(() => {
      // Create CRM entity
      // @TODO what if already exists?
      // @TODO should we create company at this stage?
      return CRM.createEntity(request.payload.email);
    })
    .then((res) => {
      // Redirect to success page
      return reply.redirect('/success')
    })
    .catch((error) => {

      // User already exists - handle error
      if(error.isBoom && error.data.code && (error.data.code == 23505)) {
        return IDM.resetPassword(request.payload.email);
      }

      // Email was invalid - handle error
      if(error.name === 'ValidationError') {
        var viewContext = View.contextDefaults(request);
        viewContext.pageTitle = 'GOV.UK - Create Account';
        viewContext.error = error;
        return reply.view('water/register_email', viewContext);
      }
      throw error;
    })
    .then(() => {
      // Redirect to success page
      return reply.redirect('/success')
    })
    .catch(errorHandler(request,reply));


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


module.exports = {
  getEmailAddress,
  postEmailAddress,
  getRegisterSuccess
};
