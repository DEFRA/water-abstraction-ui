const services = require('../../../lib/connectors/services');

/**
 * Gets user data
 * @param {Number} userId - the IDM user ID
 * @return {Promise} resolves with IDM user row
 */
async function getUser (userId) {
  // Load context data for default parameter values
  const {
    data: user,
    error: idmError
  } = await services.idm.users.findOne(userId);

  if (idmError) {
    throw new Error(idmError);
  }
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }
  // Parse user_data if string
  const { user_data: userData } = user;

  return {
    ...user,
    user_data: typeof (userData) === 'string' ? JSON.parse(userData) : userData
  };
}

/**
 * A function to get context data for generating pre-populated values in
 * notification parameter fields
 * @param {Number} userId
 * @return {Promise} resolves with context data for Nunjucks templates
 */
async function getContext (userId) {
  let context = {};

  // Load context data for default parameter values
  const user = await getUser(userId);

  context.contactDetails = user.user_data.contactDetails || {};

  return context;
}

module.exports = {
  getContext,
  getUser
};
