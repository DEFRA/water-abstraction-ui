const { get } = require('lodash');
const services = require('internal/lib/connectors/services');

const SESSION_KEY = 'contactDetailsFlow';

/**
 * Merges current and new contact details in user data object
 * @param  {Object} userData
 * @param  {Object} contactDetails
 * @return {Object} updated userData
 */
const mergeContactDetails = (userData, contactDetails) => {
  const currentDetails = userData.contactDetails || {};
  return {
    ...userData,
    contactDetails: Object.assign({}, currentDetails, contactDetails)
  };
};

/**
 * Gets contact details from session.
 * If not present, retrieves them from request
 * @param  {[type]} request [description]
 * @return {[type]}         [description]
 */
const getContactDetails = request => {
  let userData = request.yar.get(SESSION_KEY);
  if (!userData) {
    userData = request.defra.user.user_data || {};
    request.yar.set(SESSION_KEY, userData);
  }

  return get(userData, 'contactDetails', {});
};

const setContactDetails = (request, contactDetails) => {
  const userData = request.yar.get(SESSION_KEY);
  const updated = mergeContactDetails(userData, contactDetails);
  request.yar.set(SESSION_KEY, updated);
};

const submitContactDetails = async (request, contactDetails) => {
  // Merge contact data with data in session
  const userData = request.yar.get(SESSION_KEY);
  const updated = mergeContactDetails(userData, contactDetails);
  // Save to IDM
  const { userId } = request.defra;
  await services.idm.users.updateOne(userId, { user_data: updated });
  // Clear session key
  request.yar.clear(SESSION_KEY);
};

exports.get = getContactDetails;
exports.set = setContactDetails;
exports.submit = submitContactDetails;
