const serviceRequest = require('../../../../shared/lib/connectors/service-request');
const config = require('../../../config');
const { partialRight } = require('lodash');

const getBaseUrl = () => `${config.services.water}/batch-notifications`;

const prepareReturnsNotifications = (issuer, excludeLicences, messageType) => {
  const url = `${getBaseUrl()}/prepare/${messageType}`;
  return serviceRequest.post(url, {
    body: {
      issuer,
      data: {
        excludeLicences
      }
    }
  });
};

const prepareReturnsReminders = partialRight(prepareReturnsNotifications, 'returnReminder');
const prepareReturnsInvitations = partialRight(prepareReturnsNotifications, 'returnInvitation');

const sendReminders = (eventId, issuer) => {
  const url = `${getBaseUrl()}/send/${eventId}`;
  return serviceRequest.post(url, {
    body: {
      issuer
    }
  });
};
exports.prepareReturnsReminders = prepareReturnsReminders;
exports.prepareReturnsInvitations = prepareReturnsInvitations;
exports.sendReminders = sendReminders;
