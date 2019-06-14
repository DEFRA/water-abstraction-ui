const SharedDocumentsApiClient = require('shared/lib/connectors/services/crm/DocumentsApiClient');
const { get } = require('lodash');
const { throwIfError } = require('@envage/hapi-pg-rest-api');

const getUnregisteredLicenceQueryArguments = (key, value) => {
  const query = {
    [key]: { $or: value },
    company_entity_id: null,
    'metadata->IsCurrent': { $ne: 'false' }
  };

  const sort = { system_external_id: 1 };
  const pagination = { page: 1, perPage: 300 };

  return [query, sort, pagination];
};

class DocumentsApiClient extends SharedDocumentsApiClient {
  /**
   * Get licence count - gets total number of licences the supplied company ID
   * can view
   * @param {String} companyId - the individual entity ID
   * @return {Promise} resolves with integer number of licences available
   */
  async getLicenceCount (companyId) {
    const filter = { company_entity_id: companyId };
    const pagination = { page: 1, perPage: 1 };
    const response = await this.findMany(filter, null, pagination, ['document_id']);
    throwIfError(response.error);
    return get(response, 'pagination.totalRows', 0);
  }

  /**
   * Get a list of unclaimed licences for use in reg process
   * @param {Array} licenceNumbers - list of licence numbers to claim
   * @return {Promise} resolves with list of licences from CRM
   */
  getUnregisteredLicences (licenceNumbers) {
    const args = getUnregisteredLicenceQueryArguments('system_external_id', licenceNumbers);
    return this.findMany(...args);
  };

  /**
   * Get a list of unclaimed licences for use in reg process
   * @param {Array} documentIds - list of document header IDs to claim
   * @return {Promise} resolves with list of licences from CRM
   */
  getUnregisteredLicencesByIds (documentIds) {
    const args = getUnregisteredLicenceQueryArguments('document_id', documentIds);
    return this.findMany(...args);
  };
}

module.exports = DocumentsApiClient;
