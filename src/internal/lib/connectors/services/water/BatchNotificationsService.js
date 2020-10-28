'use strict';

const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class BatchNotificationsService extends ServiceClient {
  prepareBatchNotification (messageType, issuer, data) {
    const url = this.joinUrl(`batch-notifications/prepare/${messageType}`);
    return this.serviceRequest.post(url, {
      body: {
        issuer,
        data
      }
    });
  }

  prepareReturnsReminders (issuer, excludeLicences) {
    return this.prepareBatchNotification('returnReminder', issuer, { excludeLicences });
  }

  prepareReturnsInvitations (issuer, excludeLicences) {
    return this.prepareBatchNotification('returnInvitation', issuer, { excludeLicences });
  }

  preparePaperReturnForms (issuer, data) {
    return this.prepareBatchNotification('paperReturnForms', issuer, data);
  }

  sendReminders (eventId, issuer) {
    const url = this.joinUrl('batch-notifications/send', eventId);
    return this.serviceRequest.post(url, { body: { issuer } });
  };
}

module.exports = BatchNotificationsService;
