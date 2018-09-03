/* eslint new-cap: "warn" */
const Boom = require('boom');
const { get } = require('lodash');
const { documents } = require('../../lib/connectors/crm');
const { returns, versions, lines } = require('../../lib/connectors/returns');
const { externalRoles } = require('../../lib/constants');

/**
 * Gets licences from the CRM that can be viewed by the supplied entity ID
 * @param {String} entityId - individual entity GUID
 * @param {String} licenceNumber - find a particular licence number
 * @return {Promise} - resolved with array of objects with system_external_id (licence number) and document_name
 */
const getLicenceNumbers = async (entityId, filter = {}, isInternalReturnsUser) => {
  filter.entity_id = entityId;
  filter.roles = getInternalRoles(isInternalReturnsUser, filter.roles);

  const { data, error } = await documents.findMany(filter, {}, { perPage: 300 }, ['system_external_id', 'document_name', 'document_id']);

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
const getLicenceReturns = async (licenceNumbers, page = 1) => {
  const filter = {
    regime: 'water',
    licence_type: 'abstraction',
    licence_ref: {
      $in: licenceNumbers
    },
    'metadata->>isCurrent': 'true',
    start_date: {
      $gte: '2008-04-01'
    }
  };

  const sort = {
    start_date: -1,
    licence_ref: 1
  };

  const columns = ['return_id', 'licence_ref', 'start_date', 'end_date', 'metadata', 'status', 'received_date'];

  const requestPagination = {
    page,
    perPage: 50
  };

  const { data, error, pagination } = await returns.findMany(filter, sort, requestPagination, columns);
  if (error) {
    throw Boom.badImplementation('Returns error', error);
  }

  return { data, pagination };
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
    throw Boom.badImplementation(error);
  }
  return version;
};

/**
 * Checks whether any line in the return has imperial units
 * @param {Array} lines
 * @return {Boolean}
 */
const hasGallons = (lines) => {
  return lines.reduce((acc, line) => {
    return acc || line.user_unit === 'gal';
  }, false);
};

/**
 * Get return data by ID, provided date is >= April 2008
 * @param {String} returnId
 * @return {Promise} resolves with return row
 */
const getReturn = async (returnId) => {
  const filter = {
    return_id: returnId,
    start_date: {
      $gte: '2008-04-01'
    }
  };

  // Load return
  const { data: [returnData], error: returnError } = await returns.findMany(filter);
  if (returnError) {
    throw Boom.badImplementation(returnError);
  }
  if (!returnData) {
    throw Boom.notFound(`Return ${returnId} not found`);
  }

  return returnData;
};

/**
 * Loads a single return
 * @param {String} returnId
 * @return {Promise} resolves with { return, version, lines }
 */
const getReturnData = async (returnId) => {
  const returnData = await getReturn(returnId);

  // Find lines for version
  const version = await getLatestVersion(returnId);
  const filter = {
    version_id: version.version_id,
    'metadata->>isCurrent': 'true'
  };
  const sort = {
    start_date: 1
  };
  const { data: linesData, error: linesError } = await lines.findMany(filter, sort, { page: 1, perPage: 365 });
  if (linesError) {
    throw Boom.badImplementation(linesError);
  }
  return {
    return: returnData,
    version,
    lines: linesData
  };
};

/**
 * Gets data to display in returns list view
 * This can be either all returns for a particular CRM entity,
 * or additionally can be filtered e.g. by document ID
 * @param {Object} request
 * @param {String} request.auth.credentials.entity_id - CRM entity ID of the current user
 * @param {Number} request.query.page - page number, for paginated results
 * @param {String} request.params.documentId - a single document ID to retrieve (otherwise gets all)
 * @return {Promise} resolves with list view data
 */
const getReturnsViewData = async (request) => {
  const { page } = request.query;
  const { entity_id: entityId } = request.auth.credentials;
  const { documentId } = request.params;

  // Get documents from CRM
  const filter = documentId ? { document_id: documentId } : {};
  const isInternalReturns = isInternalReturnsUser(request);
  filter.roles = getInternalRoles(isInternalReturns, filter.roles);

  const documents = await getLicenceNumbers(entityId, filter, isInternalReturns);
  const licenceNumbers = documents.map(row => row.system_external_id);

  const view = {
    ...request.view,
    documents,
    document: documentId ? documents[0] : null,
    returns: []
  };

  if (licenceNumbers.length) {
    const { data, pagination } = await getLicenceReturns(licenceNumbers, page);
    const returns = groupReturnsByYear(mergeReturnsAndLicenceNames(data, documents));

    view.pagination = pagination;
    view.returns = returns;
  }

  return view;
};

/**
 * Does the hapi request object represent an internal user with returns access?
 */
const isInternalReturnsUser = request => get(request, 'permissions.returns.read', false);

/**
 * If the user is an external user, add the CRM roles that the requesting user
 * would need to have one of, in order to be authorised to view a return.
 */
const getInternalRoles = (isInternalUser, roles) => {
  return isInternalUser ? roles : [externalRoles.colleagueWithReturns, externalRoles.licenceHolder];
};

module.exports = {
  getLicenceNumbers,
  getLicenceReturns,
  groupReturnsByYear,
  mergeReturnsAndLicenceNames,
  getLatestVersion,
  hasGallons,
  getReturnData,
  getReturnsViewData,
  isInternalReturnsUser,
  getInternalRoles
};
