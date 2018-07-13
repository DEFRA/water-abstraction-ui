const { usersClient } = require('../../../lib/connectors/idm');

/**
 * A function to get context data for generating pre-populated values in
 * notification parameter fields
 * @param {Number} userId
 * @return {Promise} resolves with context data for Nunjucks templates
 */
async function getContext (userId) {
  let context = {};

  // Load context data for default parameter values
  const { data: user, error: idmError } = await usersClient.findOne(userId);
  if (idmError) {
    throw new Error(idmError);
  }
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }
  try {
    const userData = typeof (user.user_data) === 'object' ? user.user_data : JSON.parse(user.user_data);
    const { contactDetails = {} } = userData;
    context.contactDetails = contactDetails;
  } catch (err) {
    console.error(err);
  }

  return context;
}

module.exports = {
  getContext
};
