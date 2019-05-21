'use strict';

const uuid = require('uuid/v4');
const { get } = require('lodash');

const routes = require('./routes');

/**
 * Create an object that is to be persisted in the cookies
 */
const createSessionData = (sessionId, user, entityId) => {
  const session = {
    sid: sessionId,
    username: user.user_name.toLowerCase().trim(),
    user_id: user.user_id,
    entity_id: entityId,
    lastLogin: user.last_login
  };

  return session;
};

const _logIn = async (request, emailAddress) => {
  const idmConnector = request.server.methods.getConnector('idm');
  const crmConnector = request.server.methods.getConnector('crm');

  const user = await idmConnector.users.findOneByEmail(emailAddress);

  if (!user) {
    throw new Error(`IDM user with email address ${emailAddress} not found`);
  }

  let entityId = user.external_id;

  if (!entityId) {
    const entity = await crmConnector.entities.getOrCreateIndividual(user.user_name);
    entityId = entity.entity_id;
    await idmConnector.users.updateExternalId(user, entityId);
  }

  // Create session ID
  const sessionId = await request.sessionStore.create({
    user: { id: user.user_id, emailAddress: user.user_name },
    csrf_token: uuid()
  });

  // Data to store in cookie
  const session = createSessionData(sessionId, user, entityId);

  // Set user info in signed cookie
  request.cookieAuth.set(session);

  // update the credentials object with the scopes to allow permissions
  // to be calculated elsewhere. On subsequent requests this will be
  // done by the auth-credentials plugin in the onCredentials phase.
  request.auth.credentials = {
    ...session,
    scope: get(user, 'role.scopes')
  };
};

const _logOut = async request => {
  await request.sessionStore.destroy();
  request.cookieAuth.clear();
};

module.exports = {
  name: 'authPlugin',
  version: '1.0.0',
  register: async function (server, options) {
    // Import routes
    server.route(routes);

    // Attach methods to request
    server.ext({
      type: 'onPreHandler',
      method: async (request, reply) => {
        // Attach log-in/log-out methods to request
        request.logIn = email => _logIn(request, email);
        request.logOut = () => _logOut(request);

        // Continue processing request
        return reply.continue;
      }
    });
  }
};
