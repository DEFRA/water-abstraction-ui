'use strict';

const routes = require('./routes');
const { get } = require('lodash');

const getStatusCode = request => get(request, 'response.output.statusCode');

const checkIfAuthorized = (request, h) => {
  const statusCode = getStatusCode(request);
  if (statusCode >= 401 && statusCode <= 403) {
    return request.handleUnauthorized(request, h);
  }
};

const _preResponseHandler = async (request, h) => {
  return checkIfAuthorized(request, h) || h.continue();
};

const authPlugin = {
  name: 'authPlugin',
  version: '1.0.0',
  register: async function (server, options) {
    // Import routes
    server.route(routes);

    // Attach methods to request
    server.ext({
      type: 'onPreHandler',
      method: async (request, h) => {
        request.logIn = async (user) => {
          await options.signIn(request, user);
          return options.onSignIn(request, h, user);
        };

        request.logOut = async () => {
          options.signOut(request, h);
          return options.onSignOut(request, h);
        };

        request.handleUnauthorized = async () => {
          return options.onUnauthorized(request, h);
        };

        // Continue processing request
        return h.continue;
      }
    }, {
      type: 'onPreResponse',
      method: _preResponseHandler
    });
  }
};

module.exports = authPlugin;
module.exports._preResponseHandler = _preResponseHandler;
