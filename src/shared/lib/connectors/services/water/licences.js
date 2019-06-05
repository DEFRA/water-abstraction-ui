const { serviceRequest } = require('@envage/water-abstraction-helpers');
const urlJoin = require('url-join');
const Joi = require('joi');
const { pick } = require('lodash');

const schema = Joi.object({
  includeExpired: Joi.boolean(),
  companyId: Joi.string().guid()
});

class LicencesAPIClient {
  constructor (request, config) {
    this.config = config;
  }

  /**
   * Performs a GET request to the water service to get licence data relating
   * to the supplied CRM document ID
   * @param  {String} documentId   - CRM document ID
   * @param  {String} tail         - URL tail appended to base URL
   * @param  {Object} [options={}] - options
   * @param {Boolean} options.includeExpired - whether to view expired licences
   * @param {String} options.companyId - if supplied, must match CRM company ID
   * @return {Promise}              resolves with HTTP response body
   */
  _get (documentId, tail, options = {}) {
    Joi.assert(options, schema, `Invalid LicencesAPIClient options`);

    // Build URI
    const uri = urlJoin(this.config.endpoint, `/${documentId}/licence`, tail);

    // Build query params
    const qs = pick(options, ['includeExpired', 'companyId']);

    // Perform GET
    return serviceRequest.get(uri, { qs });
  };

  getSummaryByDocumentId (documentId, options = {}) {
    return this._get(documentId, '/summary', options);
  }

  getCommunicationsByDocumentId (documentId, options = {}) {
    return this._get(documentId, '/communications', options);
  }
}

module.exports = LicencesAPIClient;
