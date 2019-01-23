/**
 * Sign-in helpers
 */
const CRM = require('./connectors/crm');
const uuid = require('uuid/v4');
const { get } = require('lodash');
const idm = require('./connectors/idm');

/**
 * Loads user data from IDM
 * @param {String} emailAddress
 * @return {Promise} resolves with row of IDM user data
 */
async function getIDMUser (emailAddress) {
  const email = emailAddress.toLowerCase().trim();
  const { data: [user], error: idmError } = await idm.getUserByEmail(email);

  if (idmError) {
    throw idmError;
  }
  if (!user) {
    throw new Error(`IDM user with email address ${emailAddress} not found`);
  }
  return user;
}

/**
 * Sign user in automatically
 * Note: this does NOT check for account in IDM - this must be done separately
 * @param {Object} request - HAPI HTTP request
 * @param {String} emailAddress - email address of user
 * @return {Object} returns object with data stored in secure cookie
 */
async function auto (request, emailAddress) {
  const user = await getIDMUser(emailAddress);

  let entityId = user.external_id;

  if (!entityId) {
    entityId = await CRM.entities.getOrCreateIndividual(user.user_name);
    await idm.updateExternalId(user, entityId);
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
  request.auth.credentials = { scope: get(user, 'role.scopes') };
}

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

module.exports = {
  auto,
  createSessionData
};
