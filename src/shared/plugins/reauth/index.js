/**
* HAPI reauth plugin
*
* Certain application flows require a user to re-authenticate before
* they can perform the task.
*
* This plugin manages this via the IDM, redirecting the user to enter their
* password before redirecting back to the desired flow
*
* The user then has 10 minutes to complete their task
*
* A count of the number of password attempts is kept in the IDM.  If the
* number of attempts exceeds 10 then the user can't try again until
* the following day.
*
* On successful authentication, the attempt count is reset
*/
const Joi = require('joi');
const { get } = require('lodash');
const helpers = require('./lib/helpers');

const preHandler = async (request, h) => {
  const expiryTime = request.yar.get('reauthExpiryTime');

  // Redirect to enter password if re-auth required
  if (helpers.isExpired(expiryTime)) {
    request.yar.set('reauthRedirectPath', request.path);
    return h.redirect('/confirm-password').takeover();
  }

  // Continue processing request
  return h.continue;
};

const _handler = async (request, h) => {
  const isEnabled = get(request, 'route.settings.plugins.reauth', false);
  return isEnabled ? preHandler(request, h) : h.continue;
};

const reauthPlugin = {
  register: (server, options) => {
    Joi.assert(options.reauthenticate, Joi.func());

    server.ext({
      type: 'onPreHandler',
      method: _handler
    });
    server.route(require('./routes'));
  },

  pkg: {
    name: 'reauthPlugin',
    version: '1.0.0'
  }
};

module.exports = reauthPlugin;
module.exports._handler = _handler;
