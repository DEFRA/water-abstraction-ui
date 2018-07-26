const Boom = require('boom');
const { documents } = require('../../lib/connectors/crm');
const { returns, lines, versions } = require('../../lib/connectors/returns');

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
    }
  };

  const sort = {
    start_date: -1,
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
 * Groups and sorts returns by year descending
 * @param {Array} data
 * @return {Array} organised by year
 */
const groupReturnsByYear = (data) => {
  const grouped = data.reduce((acc, row) => {
    const year = parseInt(row.start_date.substr(0, 4));
    if (!(year in acc)) {
      acc[year] = {
        year,
        returns: []
      };
    }
    acc[year].returns.push(row);
    return acc;
  }, {});

  return Object.values(grouped).reverse();
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

  const data = await getLicenceReturns(licenceNumbers);

  const returns = groupReturnsByYear(mergeReturnsAndLicenceNames(data, documents));

  const view = {
    ...request.view,
    returns
  };

  return h.view('water/returns/index', view);
};

/**
 * Gets the most recent version of a return
 * @param {String} returnId
 * @return {Promise} resolves with object of version data on success
 */
const getLatestVersion = async (returnId) => {
  // Find newest version
  const filter = {
    return_id: returnId
  };
  const sort = {
    version_number: -1
  };
  const { error, data: [version] } = await versions.findMany(filter, sort);
  if (error) {
    throw new Boom.badImplementation(error);
  }
  return version;
};

const getReturn = async (request, h) => {
  const { id } = request.query;

  // Load return
  const { data, error: returnError } = await returns.findMany({ return_id: id });
  if (returnError) {
    throw new Boom.badImplementation(returnError);
  }

  // Find lines for version
  const version = await getLatestVersion(id);
  const filter = {
    version_id: version.version_id
  };
  const sort = {
    start_date: 1
  };
  const { data: linesData, error: linesError } = await lines.findMany(filter, sort);
  if (linesError) {
    throw new Boom.badImplementation(linesError);
  }

  const view = {
    ...request.view,
    return: data[0],
    pageTitle: `Abstraction return for ${data[0].licence_ref}`,
    lines: linesData
  };
  return h.view('water/returns/return', view);
};

module.exports = {
  getReturns,
  getReturn
};
