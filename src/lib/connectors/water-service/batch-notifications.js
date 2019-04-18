const serviceRequest = require('../service-request');
const config = require('../../../../config');

const getBaseUrl = () => `${config.services.water}/batch-notifications`;

const prepareReturnsReminders = (issuer, excludeLicences) => {
  const url = `${getBaseUrl()}/prepare/returnReminder`;
  return serviceRequest.post(url, {
    body: {
      issuer,
      data: {
        excludeLicences
      }
    }
  });
};

const sendReminders = (eventId, issuer) => {
  const url = `${getBaseUrl()}/send/${eventId}`;
  return serviceRequest.post(url, {
    body: {
      issuer
    }
  });
};

exports.prepareReturnsReminders = prepareReturnsReminders;
exports.sendReminders = sendReminders;
