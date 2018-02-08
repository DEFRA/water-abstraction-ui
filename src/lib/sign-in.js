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
async function auto (request, emailAddress, user_data) {
  const entity_id = await CRM.entities.getOrCreateIndividual(emailAddress);

  console.log('Signing in as ' + entity_id);

  // Create session ID
  const session_id = await request.sessionStore.create({
    user: {emailAddress}
  });

  try {
    user_data = JSON.parse(user_data);
  } catch (e) {
    user_data = {};
  }
  if (!user_data.usertype) {
    user_data.usertype = 'external';
  }

  // Data to store in cookie
  const session = {
    sid: session_id,
    username: emailAddress.toLowerCase().trim(),
    entity_id,
    user_data: user_data
  };

  // Set user info in signed cookie
  request.cookieAuth.set(session);
  return session;
}

module.exports = {
  auto
};
