/**
 * Creates a client connector for the CRM verification API endpoint
 * @module lib/connectors/crm-verification
 */
const { APIClient } = require('hapi-pg-rest-api');
const moment = require('moment');
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false,
});

// Create API client
const client = new APIClient(rp, {
  endpoint: `${ process.env.CRM_URI }/verification`,
  headers: {
    Authorization: process.env.JWT_TOKEN,
  },
});

/**
 * Create verification
 * @param {String} entity_id - the individual's entity ID
 * @param {String} company_entity_id - the company entity ID to verify licences for
 * @param {String} [method] - the verification method, e.g. post|phone
 * @return {Promise} resolves with user entity record
 */
function createVerification(entity_id, company_entity_id, method = 'post') {
  return client.create({
    entity_id,
    company_entity_id,
    method : 'post'
  });
}

/**
 * Enter verification code
 * @param {String} entity_id - the individual's entity ID
 * @param {String} company_entity_id - the company entity ID to verify licences for
 * @param {String} verification_code - the verification code supplied by the user
 * @return {Promise} - resolves with verification records if found
 */
function checkVerification(entity_id, company_entity_id, verification_code) {
  return client.findMany({
    entity_id,
    company_entity_id,
    verification_code
  });
}

/**
 * Complete verification
 * @param {String} verification_id - the verification ID
 * @return {Promise} - resolves if code OK
 */
function completeVerification(verification_id) {
  return client.updateOne(verification_id, {
    date_verified :  moment().format()
  });
}

/**
 * Get outstanding verifications for user
 * @param {String} entity_id - the individual's entity ID
 * @return {Promise} resolves with list of verifications that haven't been completed
 */
function getOutstandingVerifications(entity_id) {
  return client.findMany({
    entity_id,
    date_verified : null
  });
}

module.exports = {
  createVerification,
  checkVerification,
  completeVerification,
  getOutstandingVerifications
};
