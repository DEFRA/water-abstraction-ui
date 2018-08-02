/**
 * Creates a client connector for the CRM verification API endpoint
 * @module lib/connectors/crm-licences
 */
const {
  APIClient
} = require('hapi-pg-rest-api');
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
 * Get a list of licences based on the supplied options
 * @param {Object} filter - criteria to filter licence lisrt
 * @param {String} [filter.entity_id] - the current user's entity ID
 * @param {String} [filter.email] - the email address to search on
 * @param {String} [filter.string] - the search query, can be licence number, user-defined name etc.
 * @param {Object} [sort] - fields to sort on
 * @param {Number} [sort.licenceNumber] - sort on licence number, +1 : asc, -1 : desc
 * @param {Number} [sort.name] - sort on licence name, +1 : asc, -1 : desc
 * @param {Object} [pagination] - pagination controls
 * @param {Number} [pagination.page] - the current page
 * @param {Number} [pagination.perPage] - per page
 * @return {Promise} resolves with array of licence records
 * @example getLicences({entity_id : 'guid'})
 */
client.getLicences = function (filter, sort = {}, pagination = {
  page: 1,
  perPage: 100
}) {
  const uri = process.env.CRM_URI + '/documentHeader/filter';
  return rp({
    uri,
    method: 'POST',
    headers: {
      Authorization: process.env.JWT_TOKEN
    },
    json: true,
    body: {
      filter,
      sort,
      pagination
    }
  });
};

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
  } = await client.getLicences({
    entity_id: entityId
  }, null, {
    page: 1,
    perPage: 1
  });
  return totalRows;
};

/**
 * Get a list of unclaimed licences for use in reg process
 * @param {Array} licenceNumbers - list of licence numbers to claim
 * @return {Promise} resolves with list of licences from CRM
 */
client.getUnregisteredLicences = function (licenceNumbers) {
  // Get unverified licences from DB
  return this.findMany({
    system_external_id: {
      $or: licenceNumbers
    },
    verified: null,
    verification_id: null,
    'metadata->IsCurrent': {
      $ne: 'false'
    }
  }, {
    system_external_id: +1
  }, {
    page: 1,
    perPage: 300
  });
};

/**
 * Get a list of unclaimed licences for use in reg process
 * @param {Array} documentIds - list of document header IDs to claim
 * @return {Promise} resolves with list of licences from CRM
 */
client.getUnregisteredLicencesByIds = function (documentIds) {
  // Get unverified licences from DB
  return this.findMany({
    document_id: {
      $or: documentIds
    },
    verified: null,
    verification_id: null,
    'metadata->IsCurrent': {
      $ne: 'false'
    }
  }, {
    system_external_id: +1
  }, {
    page: 1,
    perPage: 300
  });
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
 * this function gets the internal ID (i.e. the ID of the licence in the permit repository)
 * from the document_id (from the CRM document header record) which can then be used to
 *  retrieve the full licence from the repo
 **/
client.getLicenceInternalID = async function (licences, document_id) {
  let licence;
  if (licence = licences.find(x => x.document_id === document_id)) {
    return licence;
  }
  throw new Error('Licence with ID ' + document_id + ' could not be found.');
};

/**
 * Get a list of licences based on the supplied options
 * @param {Object} filter - criteria to filter licence lisrt
 * @param {String} [filter.entity_id] - the current user's entity ID
 * @param {String} [filter.email] - the email address to search on
 * @param {String} [filter.string] - the search query, can be licence number, user-defined name etc.
 * @param {Object} [sort] - fields to sort on
 * @param {Number} [sort.licenceNumber] - sort on licence number, +1 : asc, -1 : desc
 * @param {Number} [sort.name] - sort on licence name, +1 : asc, -1 : desc
 * @param {Object} [pagination] - pagination controls
 * @param {Number} [pagination.page] - the current page
 * @param {Number} [pagination.perPage] - per page
 * @return {Promise} resolves with array of licence records
 * @example getLicences({entity_id : 'guid'})
 */
client.getFilteredLicences = function (filter, sort = {}, pagination = {
  page: 1,
  perPage: 100
}) {
  const uri = `${process.env.CRM_URI}/documentHeader?filter=${filter}`;
  return rp({
    uri,
    method: 'GET',
    headers: {
      Authorization: process.env.JWT_TOKEN
    }
  });
};

module.exports = client;
