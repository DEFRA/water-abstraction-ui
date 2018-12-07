/**
 * Creates a client connector for the CRM verification API endpoint
 * @module lib/connectors/crm-licences
 */
const {
  APIClient
} = require('@envage/hapi-pg-rest-api');
const Boom = require('boom');
const { crm } = require('../../../../config');
const { entityId: waterRegimeEntityId } = crm.regimes.water;

const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

// Create API client
const client = new APIClient(rp, {
  endpoint: `${process.env.CRM_URI}/documentHeader`,
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
});

/**
 * Get licence count - gets total number of licences the supplied entity ID
 * can view
 * @param {String} entityId - the individual entity ID
 * @return {Promise} resolves with integer number of licences available
 */
client.getLicenceCount = async function (entityId) {
  const {
    pagination: {
      totalRows
    }
  } = await client.findMany({
    entity_id: entityId
  }, null, {
    page: 1,
    perPage: 1
  });
  return totalRows;
};

const unregisteredLicenceQuery = (key, value) => {
  const query = {
    [key]: {
      $or: value
    },
    verification_id: null,
    'metadata->IsCurrent': {
      $ne: 'false'
    }
  };

  return client.findMany(query, {
    system_external_id: +1
  }, {
    page: 1,
    perPage: 300
  });
};

/**
 * Get a list of unclaimed licences for use in reg process
 * @param {Array} licenceNumbers - list of licence numbers to claim
 * @return {Promise} resolves with list of licences from CRM
 */
client.getUnregisteredLicences = function (licenceNumbers) {
  // Get unverified licences from DB
  return unregisteredLicenceQuery('system_external_id', licenceNumbers);
};

/**
 * Get a list of unclaimed licences for use in reg process
 * @param {Array} documentIds - list of document header IDs to claim
 * @return {Promise} resolves with list of licences from CRM
 */
client.getUnregisteredLicencesByIds = function (documentIds) {
  // Get unverified licences from DB
  return unregisteredLicenceQuery('document_id', documentIds);
};

/**
 * Set licence name
 * @param {String} documentId - the CRM document ID identifying the permit
 * @param {String} name - the user-defined document name
 * @return {Promise} resolves when name updated
 */
client.setLicenceName = function (documentId, name) {
  return this.updateOne(documentId, {
    document_name: name
  });
};

/**
 * Finds a single water abstraction licence in CRM
 * by licence number
 * @param {String} licenceRef - the licence number
 * @return {Promise} resolves with document header
 */
client.getWaterLicence = async (licenceRef) => {
  if (!licenceRef) {
    throw Boom.badImplementation('Licence number is required');
  }
  const filter = {
    regime_entity_id: waterRegimeEntityId,
    system_external_id: licenceRef
  };
  const { error, data: [document] } = await client.findMany(filter);
  if (error) {
    throw Boom.badImplementation(error);
  }
  if (!document) {
    throw Boom.notFound(`Water licence number ${licenceRef} not found in CRM`);
  }
  return document;
};

module.exports = client;
