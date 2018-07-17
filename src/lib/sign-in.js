/**
 * Sign-in helpers
 */
const CRM = require('./connectors/crm');
const { createGUID } = require('./helpers');
const { usersClient } = require('./connectors/idm');

/**
 * Loads user data from IDM
 * @param {String} emailAddress
 * @return {Promise} resolves with row of IDM user data
 */
async function getIDMUser (emailAddress) {
  // Get IDM record
  const { data: [user], error: idmError } = await usersClient.findMany({user_name: emailAddress.toLowerCase().trim()});
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
async function auto (request, emailAddress, userData = {}, lastlogin) {
  const user = await getIDMUser(emailAddress);

  const entityId = await CRM.entities.getOrCreateIndividual(user.user_name);

  // Get roles for user
  const {error, data: roles} = await CRM.entityRoles.setParams({entityId}).findMany();

  if (error) {
    throw error;
  }

  // Create session ID
  const sessionId = await request.sessionStore.create({
    user: { id: user.user_id, emailAddress: user.user_name },
    csrf_token: createGUID()
  });

  if (!userData.usertype) {
    userData.usertype = 'external';
  }

  if (lastlogin) {
    userData.newuser = false;
    userData.lastlogin = lastlogin;
  } else {
    userData.newuser = true;
    userData.lastlogin = null;
  }

  // Data to store in cookie
  const session = {
    sid: sessionId,
    username: emailAddress.toLowerCase().trim(),
    user_id: user.user_id,
    entity_id: entityId,
    user_data: userData,
    lastlogin: lastlogin,
    roles
  };

  // Set user info in signed cookie
  request.cookieAuth.set(session);

  return session;
}

module.exports = {
  auto
};
