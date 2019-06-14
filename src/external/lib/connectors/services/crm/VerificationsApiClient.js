const SharedVerificationsApiClient = require('shared/lib/connectors/services/crm/VerificationsApiClient');

class VerificationsApiClient extends SharedVerificationsApiClient {
  /**
 * Get outstanding verifications for the supplied entityId
 * @param {String} entityId - the individual entity who claimed the licences
 * @return {Promise} resolves with list of verifications
 */
  getOutstandingVerifications (entityId) {
    return this.findMany({ entity_id: entityId, date_verified: null });
  }
}

module.exports = VerificationsApiClient;
