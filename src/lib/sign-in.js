/**
 * Sign-in helpers
 */
const CRM = require('./connectors/crm');
const Helpers = require('./helpers');

/**
 * Sign user in automatically
 * Note: this does NOT check for account in IDM - this must be done separately
 * @param {Object} request - HAPI HTTP request
 * @param {String} emailAddress - email address of user
 * @return {Object} returns object with data stored in secure cookie
 */
async function auto(request, emailAddress) {

  const entity_id = await CRM.getOrCreateIndividualEntity(emailAddress);

  const session = {
    sid : Helpers.createGUID(),
    username : emailAddress.toLowerCase().trim(),
    entity_id
  };

  // Set user info in signed cookie
  request.cookieAuth.set(session);
  return session;
}

module.exports = {
  auto
};
