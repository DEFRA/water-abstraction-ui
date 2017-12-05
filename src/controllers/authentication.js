/**
 * HAPI Route handlers for signing in to account
 * @module controllers/authentication
 */
const CRM = require('../lib/connectors/crm');
const IDM = require('../lib/connectors/idm');
const View = require('../lib/view');
const Permit = require('../lib/connectors/permit');
const Boom = require('boom');
const errorHandler = require('../lib/error-handler');
const Helpers = require('../lib/helpers');

/**
 * View signin page
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 */
function getSignin(request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - Sign in to view your licence'
  return reply.view('water/signin', viewContext)
}

/**
 * View signout page
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 */
function getSignout(request, reply) {
  request.cookieAuth.clear()
  return reply.redirect('/?access=PB01')
}

/**
 * Process login form request
 * @param {Object} request - the HAPI HTTP request
 * @param {String} request.payload.user_id - the user email address
 * @param {String} request.payload.password - the user password
 * @param {Object} reply - the HAPI HTTP response
 */
function postSignin(request, reply) {

    IDM.login(request.payload.user_id, request.payload.password).then((getUser) => {

      // Check for password reset flag - if set don't log them in yet and force
      // password reset
      if (getUser.body.reset_required && getUser.body.reset_required == 1) {
        throw {
          message : 'Password reset required',
          reset_guid : getUser.body.reset_guid
        };
      }

      // Get the CRM user for the authenticated email address
      return CRM.getEntity(request.payload.user_id);

    })
    .then(({error, data}) => {

      if(error) {
        throw Boom.badImplementation(`CRM error`, error);
      }

      // Get the entity ID for the current user from CRM response
      const { entity_id } = data.entity;

      if(!entity_id) {
        throw Boom.badImplementation(`CRM error: User ${request.auth.credentials.username} not found`, response);
      }

      // Set user info in signed cookie
      request.cookieAuth.set({
        sid : Helpers.createGUID(),
        username : request.payload.user_id,
        entity_id
      });

      // Resolves Chrome issue where it won't set cookie and redirect in same request
      // @see {@link https://stackoverflow.com/questions/40781534/chrome-doesnt-send-cookies-after-redirect}
      return reply('<meta http-equiv="refresh" content="0; url=/licences" /><script>location.href=\'/licences\'</script>');

    })
    .catch((err) => {

      // Forces password reset
      if(err.reset_guid) {
        reply.redirect('reset_password_change_password' + '?resetGuid=' + err.reset_guid + '&forced=1');
      }
      // Unauthorised status
      else if (err.statusCode && err.statusCode == 401) {
        var viewContext = View.contextDefaults(request)
        viewContext.payload = request.payload
        viewContext.errors = {}
        viewContext.errors['authentication'] = 1
        viewContext.pageTitle = 'GOV.UK - Sign in to view your licence'
        return reply.view('water/signin', viewContext).code(401);
      }
      else {
        errorHandler(request, reply)(err);
      }
    });
}

module.exports = {
  getSignin,
  getSignout,
  postSignin
};
