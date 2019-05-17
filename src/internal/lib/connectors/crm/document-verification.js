/**
 * Creates a client connector for the CRM verification API endpoint
 * @module lib/connectors/crm-verification
 */
const { APIClient } = require('@envage/hapi-pg-rest-api');
const rp = require('request-promise-native').defaults({ proxy: null, strictSSL: false });
const serviceRequest = require('../../../../shared/lib/connectors/service-request');

// Create API client
const client = new APIClient(rp, {
  endpoint: `${process.env.CRM_URI}/document_verifications`,
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
});

/**
 * Get outstanding verifications for the supplied document id
 */
client.getDocumentVerifications = documentId => {
  const url = `${process.env.CRM_URI}/document_verifications`;

  const qs = {
    filter: JSON.stringify({
      document_id: documentId,
      'verification.date_verified': null
    })
  };

  return serviceRequest.get(url, { qs });
};

module.exports = client;
