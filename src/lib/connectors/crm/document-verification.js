/**
 * Creates a client connector for the CRM verification API endpoint
 * @module lib/connectors/crm-verification
 */
const {
  APIClient
} = require('@envage/hapi-pg-rest-api');
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

// Create API client
const client = new APIClient(rp, {
  endpoint: `${process.env.CRM_URI}/document_verifications`,
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
});

/**
 * Get outstanding verifications for the supplied entityId
 * @param {String} document_id - the document id
 * @return {Promise} resolves with list of verifications
 */
client.getDocumentVerifications = function (document_id) {
  return client.findMany({
    document_id: document_id
  });
};

module.exports = client;
