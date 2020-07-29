const ServiceClient = require('../ServiceClient');
const Joi = require('@hapi/joi');
const { pick } = require('lodash');

const schema = Joi.object({
  includeExpired: Joi.boolean(),
  companyId: Joi.string().guid()
});

/**
 * Performs a GET request to the water service to get licence data relating
 * to the supplied CRM document ID
 * @param {String} url      - The url to make the request to
 * @param  {Object} [options={}] - options
 * @param {Boolean} options.includeExpired - whether to view expired licences
 * @param {String} options.companyId - if supplied, must match CRM company ID
 * @return {Promise}              resolves with HTTP response body
 */
const getRequest = (serviceRequest, url, options = {}) => {
  Joi.assert(options, schema, `Invalid LicencesApiClient options`);

  // Build query params
  const qs = pick(options, ['includeExpired', 'companyId']);

  // Perform GET
  return serviceRequest.get(url, { qs });
};

class LicencesService extends ServiceClient {
  getSummaryByDocumentId(documentId, options = {}) {
    const url = this.joinUrl('documents', documentId, 'licence/summary');
    return getRequest(this.serviceRequest, url, options);
  }

  getCommunicationsByDocumentId(documentId, options = {}) {
    const url = this.joinUrl('documents', documentId, 'licence/communications');
    return getRequest(this.serviceRequest, url, options);
  }

  getByDocumentId(documentId, options = {}) {
    const url = this.joinUrl('documents', documentId, 'licence');
    return getRequest(this.serviceRequest, url, options);
  }

  getConditionsByDocumentId(documentId) {
    const url = this.joinUrl('documents', documentId, 'licence/conditions');
    return getRequest(this.serviceRequest, url);
  }

  getPointsByDocumentId(documentId) {
    const url = this.joinUrl('documents', documentId, 'licence/points');
    return getRequest(this.serviceRequest, url);
  }

  getUsersByDocumentId(documentId, options) {
    const url = this.joinUrl('documents', documentId, 'licence/users');
    return getRequest(this.serviceRequest, url, options);
  }

  async getPrimaryUserByDocumentId(documentId, options) {
    const userResponse = await this.getUsersByDocumentId(documentId, options);
    const users = userResponse.data || [];
    const primaryUser = users.find(user => user.roles.includes('primary_user'));
    return { data: primaryUser };
  }

  getCompanyByDocumentId(documentId, options = {}) {
    const url = this.joinUrl('documents', documentId, 'licence/company');
    return getRequest(this.serviceRequest, url, options);
  }

  patchUnlinkLicence(documentId, callingUserId) {
    const url = this.joinUrl('documents', documentId, 'unlink-licence');
    return this.serviceRequest.patch(url, {
      body: {
        callingUserId
      }
    });
  }

  getLicenceById(licenceId) {
    const url = this.joinUrl('licences', licenceId);
    return getRequest(this.serviceRequest, url);
  }
}

module.exports = LicencesService;
