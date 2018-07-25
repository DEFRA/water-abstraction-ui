const Boom = require('boom');
const { documents } = require('../../lib/connectors/crm');
const { returns } = require('../../lib/connectors/returns');

/**
 * Gets licences from the CRM that can be viewed by the supplied entity ID
 * @param {String} entityId - individual entity GUID
 * @return {Promise} - resolved with array of objects with system_external_id (licence number) and document_name
 */
const getLicenceNumbers = async (entityId) => {
  const filter = { entity_id: entityId };

  const { data, error } = await documents.findMany(filter, {}, { perPage: 300 }, ['system_external_id', 'document_name']);

  if (error) {
    throw Boom.badImplementation('CRM error', error);
  }

  return data;
};

/**
 * Get the returns for a list of licence numbers
 * @param {Array} list of licence numbers to get returns data for
 * @return {Promise} resolves with returns
 */
const getLicenceReturns = async (licenceNumbers) => {
  const filter = {
    regime: 'water',
    licence_type: 'abstraction',
    licence_ref: {
      $in: licenceNumbers
    },
    start_date: {
      $gt: '2008-01-01'
    }
  };

  const sort = {
    start_date: 1,
    licence_ref: 1
  };

  const columns = ['return_id', 'start_date', 'metadata'];

  const { data, error } = await returns.findMany(filter, sort, columns);
  if (error) {
    throw Boom.badImplementation('Returns error', error);
  }

  return data;
};

/**
 * Groups returns by year
 * @param {Array} data
 * @return {Array} organised by year
 */
const groupReturnsByYear = (data) => {
  return data.reduce((acc, row) => {
    const year = parseInt(row.start_date.substr(0, 4));
    if (!(year in acc)) {
      acc[year] = [];
    }
    acc[year].push(row);
    return acc;
  }, {});
};

/**
 * Merges returns data with licence names
 * @param {Array} returnsData - data from returns module
 * @param {Array} documents - data from CRM document headers
 * @return {Array} returns data with licenceName property added
 */
const mergeReturnsAndLicenceNames = (returnsData, documents) => {
  const map = documents.reduce((acc, row) => {
    return {
      ...acc,
      [row.system_external_id]: row.document_name
    };
  }, {});
  return returnsData.map(row => {
    return {
      ...row,
      licenceName: map[row.licence_ref]
    };
  });
};

/**
 * Gets and displays a list of returns for the current user,
 * grouped by year
 */
const getReturns = async (request, h) => {
  const { entity_id: entityId } = request.auth.credentials;

  const documents = await getLicenceNumbers(entityId);

  const licenceNumbers = documents.map(row => row.system_external_id);

  console.log(licenceNumbers);

  const data = await getLicenceReturns(licenceNumbers);

  const returns = groupReturnsByYear(mergeReturnsAndLicenceNames(data, documents));

  console.log(JSON.stringify(returns, null, 2));

  const view = {
    ...request.view,
    returns
  };

  return h.view('water/returns/index', view);
};

module.exports = {
  getReturns
};
