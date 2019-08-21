const { get } = require('lodash');
const services = require('internal/lib/connectors/services');

const SESSION_KEY = 'contactDetailsFlow';

const getContactDetails = request => {
  let userData = request.yar.get(SESSION_KEY);

  if (!userData) {
    userData = request.defra.user_data || {};
    request.yar.set(SESSION_KEY, userData);
  }

  return get(userData, 'contactDetails', {});
};

const setContactDetails = (request, contactDetails) => {
  const userData = request.yar.get(SESSION_KEY);
  const currentDetails = userData.contactDetails || {};
  userData.contactDetails = Object.assign({}, currentDetails, contactDetails);
  request.yar.set(SESSION_KEY, userData);
};

const submitContactDetails = (request, contactDetails) => {
  const { userId } = request.defra;
  const userData = get(request, 'defra.user.user_data', {});
  userData.contactDetails = contactDetails;
  return services.idm.users.update(userId, { user_data: userData });
};

exports.get = getContactDetails;
exports.set = setContactDetails;
exports.submit = submitContactDetails;
