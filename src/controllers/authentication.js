/**
 * HAPI Route handlers for signing in to account
 * @module controllers/authentication
 */
const Joi = require('joi');
const IDM = require('../lib/connectors/idm');
const View = require('../lib/view');
const errorHandler = require('../lib/error-handler');
const joiPromise = require('../lib/joi-promise');
const signIn = require('../lib/sign-in');
const { getPermissions } = require('../lib/permissions');

class PasswordResetRequiredError extends Error {
  constructor (message, resetGuid) {
    super(message);
    this.reset_guid = resetGuid;
    this.name = 'PasswordResetRequiredError';
  }
}

/**
 * Welcome page before routing to signin/register
 */
function getWelcome (request, reply) {
  var viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'Choose an option to view your licences';
  return reply.view('water/welcome', viewContext);
}

/**
 * View signin page
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 */
function getSignin (request, reply) {
  var viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'Sign in';
  viewContext.customTitle = 'Sign in - Manage your water abstraction or impoundment licence';
  return reply.view('water/signin', viewContext);
}

/**
 * View signout page
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 */
async function getSignout (request, reply) {
  await request.sessionStore.destroy();
  request.cookieAuth.clear();
  return reply.redirect('/');
}

/**
 * Process login form request
 * @param {Object} request - the HAPI HTTP request
 * @param {String} request.payload.user_id - the user email address
 * @param {String} request.payload.password - the user password
 * @param {Object} reply - the HAPI HTTP response
 */
async function postSignin (request, reply) {
  const destroySession = async () => {
    try {
      await request.sessionStore.destroy();
    } catch (err) {
      if (err.name !== 'NotFoundError' && err.name !== 'NoSessionCookieError') {
        throw err;
      }
    }
  };

  // Validation schema for HTTP form post
  const schema = {
    user_id: Joi.string().email().required(),
    password: Joi.string().required().min(8)
  };

  joiPromise(request.payload, schema)
    .then(() => {
      return IDM.login(request.payload.user_id, request.payload.password);
    })
    .then(async (getUser) => {
      await destroySession();
      return getUser;
    })
    .then((getUser) => {
      // Check for password reset flag - if set don't log them in yet and force
      // password reset
      if (getUser.body.reset_required && getUser.body.reset_required === 1) {
        throw new PasswordResetRequiredError('Password reset required', getUser.body.reset_guid);
      }
      // OK, sign in user
      return signIn.auto(request, request.payload.user_id, getUser.body.user_data, getUser.body.last_login);
    })
    .then(async (session) => {
      // Calculate permissions based on roles
      const permissions = await getPermissions({ roles: session.roles });
      const redirectPath = permissions.admin.defra ? '/admin/licences' : '/licences';

      // Resolves Chrome issue where it won't set cookie and redirect in same request
      // @see {@link https://stackoverflow.com/questions/40781534/chrome-doesnt-send-cookies-after-redirect}
      return reply(`<meta http-equiv="refresh" content="0; url=${redirectPath}" /><script>location.href='${redirectPath}';</script>`);
    })
    .catch((err) => {
      console.log(err);
      // Forces password reset
      if (err.reset_guid) {
        reply.redirect('reset_password_change_password' + '?resetGuid=' + err.reset_guid + '&forced=1');
      } else if ((err.statusCode && err.statusCode === 401) || (err.name && err.name === 'ValidationError')) {
        var viewContext = View.contextDefaults(request);
        viewContext.payload = request.payload;
        viewContext.errors = {};
        viewContext.errors['authentication'] = 1;
        viewContext.pageTitle = 'Sign in - Manage your water abstraction or impoundment licence';
        return reply.view('water/signin', viewContext).code(401);
      } else {
        errorHandler(request, reply)(err);
      }
    });
}

module.exports = {
  getWelcome,
  getSignin,
  getSignout,
  postSignin
};
