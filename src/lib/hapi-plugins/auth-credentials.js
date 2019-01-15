/**
 * Plugin to allow modifcation of the credentials object
 * before the preAuth phase begins.
 *
 * In the first instance this allow scopes to be updated
 * from the user object, rather than having to save this in the cookie
 * and have it injected into credentials via the hapi-auth-cookie plugin.
 */
const idmConnector = require('../connectors/idm');
const { get } = require('lodash');
const logger = require('../logger');

const shouldLoadScopes = request => request.auth.isAuthenticated;

const getUserId = request => get(request, 'auth.credentials.user_id');

const getUser = async request => {
  const userId = getUserId(request);
  const { error, data: user } = await idmConnector.getUser(userId);

  if (error) {
    error.params = {
      credentials: request.auth.credentials
    };
    throw error;
  }
  return user;
};

const plugin = {
  register: (server, options) => {
    server.ext({
      type: 'onCredentials',
      async method (request, h) {
        if (shouldLoadScopes(request)) {
          try {
            const user = await getUser(request);
            request.auth.credentials.scope = get(user, 'role.scopes');
          } catch (error) {
            logger.error('Failed to load user', error);
          }
        }
        return h.continue;
      }
    });
  },

  pkg: {
    name: 'authCredentialsPlugin',
    version: '2.0.0'
  }
};

module.exports = plugin;
