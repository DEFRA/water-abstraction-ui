const SharedVerificationsApiClient = require('shared/lib/connectors/services/crm/VerificationsApiClient');
const { throwIfError } = require('@envage/hapi-pg-rest-api');

class VerificationsApiClient extends SharedVerificationsApiClient {
  /**
 * Get outstanding verifications for the supplied entityId
 * @param {String} entityId - the individual entity who claimed the licences
 * @return {Promise} resolves with list of verifications
 */
  getOutstandingVerifications (entityId) {
    return this.findMany({ entity_id: entityId, date_verified: null });
  }

  /**
   * Creates a new verification for the supplied combination of
   * individual, company, and a list of document header IDs
   * @param {String} entityId - the individual entity ID
   * @param {String} companyEntityId - the company entity ID
   * @param {Array} documentIds - a list of document IDs to create the verification for
   * @return {Promise} resolves with {verification_id, verification_code}
   */
  async createVerification (entityId, companyEntityId, documentIds) {
    const verificationData = {
      entity_id: entityId,
      company_entity_id: companyEntityId,
      method: 'post'
    };

    const { error: createError, data: createData } = await this.create(verificationData);

    throwIfError(createError);

    const { verification_id: verificationId } = createData;

    const { error: addError } = await this.addDocuments(verificationId, documentIds);

    throwIfError(addError);

    return createData;
  }
}

module.exports = VerificationsApiClient;
