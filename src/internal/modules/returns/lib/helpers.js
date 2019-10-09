/* eslint new-cap: "warn" */
const Boom = require('@hapi/boom');
const { get, isObject, findLastKey } = require('lodash');

const config = require('../../../config');
const services = require('../../../lib/connectors/services');

const { getReturnPath } = require('internal/lib/return-path');
const badge = require('shared/lib/returns/badge');
const dates = require('shared/lib/returns/dates');

/**
 * Gets all licences from the CRM that can be viewed by the supplied entity ID
 * @param {Object} request - current HAPI request
 * @param {Object} filter - additional filter params
 * @return {Promise} - resolved with array of objects with system_external_id (licence number) and document_name
 */
const getLicenceNumbers = (request, filter = {}) => {
  const f = Object.assign({}, filter, {
    regime_entity_id: config.crm.regimes.water.entityId,
    includeExpired: true
  });

  const sort = {};
  const columns = ['system_external_id', 'document_name', 'document_id', 'metadata'];

  return services.crm.documents.findAll(f, sort, columns);
};

/**
 * Gets the filter to use for retrieving licences from returns service
 * @param {Array} licenceNumbers
 * @return {Object} filter
 */
const getLicenceReturnsFilter = (licenceNumbers) => {
  return {
    regime: 'water',
    licence_type: 'abstraction',
    licence_ref: {
      $in: licenceNumbers
    },
    start_date: {
      $gte: '2008-04-01'
    }
  };
};

/**
 * Get the returns for a list of licence numbers
 * @param {Array} list of licence numbers to get returns data for
 * @return {Promise} resolves with returns
 */
const getLicenceReturns = async (licenceNumbers, page = 1) => {
  const filter = getLicenceReturnsFilter(licenceNumbers);

  const sort = {
    start_date: -1,
    licence_ref: 1
  };

  const columns = [
    'return_id', 'licence_ref', 'start_date', 'end_date', 'metadata',
    'status', 'received_date', 'due_date', 'return_requirement'
  ];

  const requestPagination = isObject(page) ? page : {
    page,
    perPage: 50
  };

  const { data, error, pagination } = await services.returns.returns.findMany(filter, sort, requestPagination, columns);
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
    const year = parseInt(row.end_date.substr(0, 4));
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
 * Gets return total, which can also be null if no values are filled in
 * @param {Object} ret - return model from water service
 * @return {Number|null} total or null
 */
const getReturnTotal = (ret) => {
  if (!ret.lines) {
    return null;
  }
  const lines = ret.lines.filter(line => line.quantity !== null);
  return lines.length === 0 ? null : lines.reduce((acc, line) => {
    return acc + parseFloat(line.quantity);
  }, 0);
};

const mapReturnRow = (row, request) => {
  const isPastDueDate = dates.isReturnPastDueDate(row);
  return {
    ...row,
    badge: badge.getBadge(row.status, isPastDueDate),
    ...getReturnPath(row, request)
  };
};

/**
 * Adds some flags to the returns to help with view rendering
 *
 * Adds an editable flag to each return in list
 * This is based on the status of the return, and whether the user
 * has internal returns role.
 *
 * Adds isPastDueDate flag to help with badge selection.
 *
 * @param {Array} returns - returned from returns service
 * @param {Object} request - HAPI request interface
 * @return {Array} returns with isEditable flag added
 */
const mapReturns = (returns, request) => {
  return returns.map(row => mapReturnRow(row, request));
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
  const { documentId } = request.params;

  // Get documents from CRM
  const filter = documentId ? { document_id: documentId } : {};

  const documents = await getLicenceNumbers(request, filter);
  const licenceNumbers = documents.map(row => row.system_external_id);

  const view = {
    ...request.view,
    documents,
    document: documentId ? documents[0] : null,
    returns: []
  };

  if (licenceNumbers.length) {
    const { data, pagination } = await getLicenceReturns(licenceNumbers, page, true);
    const returns = groupReturnsByYear(mergeReturnsAndLicenceNames(mapReturns(data, request), documents));

    view.pagination = pagination;
    view.returns = returns;
  }

  return view;
};

/**
 * Get common view data used by many controllers
 * @param {Object} HAPI request instance
 * @param {Object} data - the return model
 * @return {Promise} resolves with view data
 */
const getViewData = async (request, data) => {
  const documentHeader = await services.crm.documents.getWaterLicence(data.licenceNumber, true);
  return {
    ...request.view,
    documentHeader,
    data
  };
};

const endReadingKey = data => findLastKey(get(data, 'meters[0].readings'), key => key > 0);

exports.getLicenceNumbers = getLicenceNumbers;
exports.getLicenceReturns = getLicenceReturns;
exports.groupReturnsByYear = groupReturnsByYear;
exports.mergeReturnsAndLicenceNames = mergeReturnsAndLicenceNames;
exports.getReturnsViewData = getReturnsViewData;
exports.getReturnTotal = getReturnTotal;
exports.getViewData = getViewData;
exports.mapReturns = mapReturns;
exports.endReadingKey = endReadingKey;
