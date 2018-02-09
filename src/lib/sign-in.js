/**
 * Sign-in helpers
 */
const CRM = require('./connectors/crm');

/**
 * Sign user in automatically
 * Note: this does NOT check for account in IDM - this must be done separately
 * @param {Object} request - HAPI HTTP request
 * @param {String} emailAddress - email address of user
 * @return {Object} returns object with data stored in secure cookie
 */
async function auto (request, emailAddress, userData) {
  const entityId = await CRM.entities.getOrCreateIndividual(emailAddress);

  console.log('Signing in as ' + entityId);

  // Create session ID
  const sessionId = await request.sessionStore.create({
    user: {emailAddress}
  });

  try {
    userData = JSON.parse(userData);
  } catch (e) {
    userData = {};
  }
  if (!userData.usertype) {
    userData.usertype = 'external';
  }

  // Data to store in cookie
  const session = {
    sid: sessionId,
    username: emailAddress.toLowerCase().trim(),
    entity_id: entityId,
    user_data: userData
  };

  // Set user info in signed cookie
  request.cookieAuth.set(session);
  return session;
}

module.exports = {
  auto
};
