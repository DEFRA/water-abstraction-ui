const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

const prepareReturnsNotifications = (serviceRequest, url, issuer, excludeLicences) => {
  return serviceRequest.post(url, {
    body: {
      issuer,
      data: { excludeLicences }
    }
  });
};

class BatchNotificationsService extends ServiceClient {
  prepareReturnsReminders (issuer, excludeLicences) {
    const url = this.joinUrl('batch-notifications/prepare/returnReminder');
    return prepareReturnsNotifications(this.serviceRequest, url, issuer, excludeLicences);
  }

  prepareReturnsInvitations (issuer, excludeLicences) {
    const url = this.joinUrl('batch-notifications/prepare/returnInvitation');
    return prepareReturnsNotifications(this.serviceRequest, url, issuer, excludeLicences);
  }

  sendReminders (eventId, issuer) {
    const url = this.joinUrl('batch-notifications/send', eventId);
    return this.serviceRequest.post(url, { body: { issuer } });
  };
}

module.exports = BatchNotificationsService;
