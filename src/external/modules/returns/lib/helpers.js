/* eslint new-cap: "warn" */
const Boom = require('boom');
const moment = require('moment');
const { get, isObject, findLastKey, last } = require('lodash');
const titleCase = require('title-case');

const { isInternal: isInternalUser, isExternalReturns } = require('../../../lib/permissions');
const { returns, versions } = require('../../../lib/connectors/returns');
const config = require('../../../config');
const services = require('../../../lib/connectors/services');

const { getReturnPath } = require('./return-path');
const { throwIfError } = require('@envage/hapi-pg-rest-api');
const helpers = require('@envage/water-abstraction-helpers');

/**
 * Gets the current return cycle object
 * @param  {String} [date] - reference date, for unit testing
 * @return {Object}      { startDate, endDate, isSummer }
 */
const getCurrentCycle = (date) => {
  return last(helpers.returns.date.createReturnCycles(undefined, date));
};

/**
 * Gets all licences from the CRM that can be viewed by the supplied entity ID
 * @param {Object} request - current HAPI request
 * @param {Object} filter - additional filter params
 * @return {Promise} - resolved with array of objects with system_external_id (licence number) and document_name
 */
const getLicenceNumbers = (request, filter = {}) => {
  const f = Object.assign({}, filter, {
    regime_entity_id: config.crm.regimes.water.entityId,
    company_entity_id: get(request, 'defra.companyId')
  });

  const sort = {};
  const columns = ['system_external_id', 'document_name', 'document_id', 'metadata'];

  return services.crm.documents.findAll(f, sort, columns);
};

/**
 * Gets the filter to use for retrieving licences from returns service
 * @param {Array} licenceNumbers
 * @param {Boolean} isInternal
 * @return {Object} filter
 */
const getLicenceReturnsFilter = (licenceNumbers, isInternal) => {
  const showFutureReturns = get(config, 'returns.showFutureReturns', false);

  const filter = {
    regime: 'water',
    licence_type: 'abstraction',
    licence_ref: {
      $in: licenceNumbers
    },
    start_date: {
      $gte: '2008-04-01'
    }
  };

  // External users can only view returns for the current version of a licence
  // and cannot see void returns.
  if (!isInternal) {
    filter['metadata->>isCurrent'] = 'true';
    filter.status = { $ne: 'void' };
  }

  // External users on production-like environments can only view returns where
  // return cycle is in the past
  if (!isInternal && !showFutureReturns) {
    filter.end_date = {
      $lte: moment().format('YYYY-MM-DD')
    };
  }

  return filter;
};

/**
 * Get the returns for a list of licence numbers
 * @param {Array} list of licence numbers to get returns data for
 * @return {Promise} resolves with returns
 */
const getLicenceReturns = async (licenceNumbers, page = 1, isInternal = false) => {
  const filter = getLicenceReturnsFilter(licenceNumbers, isInternal);

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

  const { data, error, pagination } = await returns.findMany(filter, sort, requestPagination, columns);
  if (error) {
    throw Boom.badImplementation('Returns error', error);
  }

  return { data, pagination };
};

/**
 * Checks whether user uses XML Upload for a list of licence numbers
 * @param {Array} licenceNumbers to check if isUpload flag is true
 * @param {String} [refDate] todays date, used for unit testing
 * @return {Promise<boolean>} if user has XML Upload functionality
 */
const isXmlUpload = async (licenceNumbers, refDate) => {
  const cycle = getCurrentCycle(refDate);

  const filter = {
    'metadata->>isUpload': 'true',
    'metadata->>isCurrent': 'true',
    'metadata->>isSummer': cycle.isSummer ? 'true' : 'false',
    status: 'due',
    start_date: { $gte: cycle.startDate },
    end_date: {
      $gte: '2018-10-31',
      $lte: cycle.endDate
    },
    licence_ref: { '$in': licenceNumbers }
  };

  const requestPagination = { 'page': 1, 'perPage': 1 };
  const columns = ['return_id'];

  const { error, pagination } = await returns.findMany(filter, {}, requestPagination, columns);
  throwIfError(error);

  return pagination.totalRows > 0;
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

const isReturnPastDueDate = returnRow => {
  const dueDate = moment(returnRow.due_date, 'YYYY-MM-DD');
  const today = moment().startOf('day');
  return dueDate.isBefore(today);
};

const mapReturnRow = (row, request) => {
  const isPastDueDate = isReturnPastDueDate(row);
  return {
    ...row,
    badge: getBadge(row.status, isPastDueDate),
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
 * @param {Number} request.query.page - page number, for paginated results
 * @param {String} request.params.documentId - a single document ID to retrieve (otherwise gets all)
 * @return {Promise} resolves with list view data
 */
const getReturnsViewData = async (request) => {
  const { page } = request.query;
  const { documentId } = request.params;

  // Get documents from CRM
  const filter = documentId ? { document_id: documentId } : {};

  const isInternal = isInternalUser(request);

  const documents = await getLicenceNumbers(request, filter);
  const licenceNumbers = documents.map(row => row.system_external_id);
  const xmlUpload = await isXmlUpload(licenceNumbers);
  const externalReturns = isExternalReturns(request);

  const view = {
    ...request.view,
    documents,
    document: documentId ? documents[0] : null,
    xmlUser: xmlUpload && externalReturns,
    returns: []
  };

  if (licenceNumbers.length) {
    const { data, pagination } = await getLicenceReturns(licenceNumbers, page, isInternal);
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
  const isInternal = isInternalUser(request);
  const documentHeader = await services.crm.documents.getWaterLicence(data.licenceNumber, isInternal);
  return {
    ...request.view,
    documentHeader,
    data
  };
};

/**
 * When searching for return by ID, gets redirect path which is either to
 * the completed return page, or the edit return flow if not yet completed
 * @param {Object} ret - return object from returns service
 * @param {Boolean} isMultiple - if true, redirect to licence disambiguation page
 * @return {String} redirect path
 */
const getRedirectPath = (ret, isMultiple = false) => {
  const { return_id: returnId, status, return_requirement: formatId } = ret;
  if (isMultiple) {
    return `/returns/select-licence?formatId=${formatId}`;
  }
  return status === 'completed' ? `/returns/return?id=${returnId}` : `/return/internal?returnId=${returnId}`;
};

/**
 * Checks whether supplied string is a return ID as currently supported in
 * the digital service.  This consists of a version prefix, region code,
 * licence number, format ID and return cycle date range
 * @param {String} returnId - the string to test
 * @return {Boolean} true if match
 */
const isReturnId = (returnId) => {
  const r = /^v1:[1-8]:[^:]+:[0-9]+:[0-9]{4}-[0-9]{2}-[0-9]{2}:[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  return r.test(returnId);
};

/**
 * Get field suffix - this is the units used for this return
 * @param {String} unit - internal SI unit or gal
 * @return {String} suffix - human readable unit
 */
const getSuffix = (unit) => {
  const u = unit.replace('³', '3');
  const units = {
    m3: 'cubic metres',
    l: 'litres',
    gal: 'gallons',
    Ml: 'megalitres'
  };
  return units[u];
};

/**
 * Gets badge object to render for return row
 * @param  {String}  status    - return status
 * @param  {Boolean} isPastDue - whether return is past due
 * @return {Object}            - badge text and style
 */
const getBadge = (status, isPastDueDate) => {
  const viewStatus = ((status === 'due') && isPastDueDate) ? 'overdue' : status;

  const styles = {
    overdue: 'success',
    due: 'due',
    received: 'completed',
    completed: 'completed',
    void: 'void'
  };

  return {
    text: titleCase(viewStatus),
    status: styles[viewStatus]
  };
};

const endReadingKey = data => findLastKey(get(data, 'meters[0].readings'), key => key > 0);

exports.getLicenceNumbers = getLicenceNumbers;
exports.getLicenceReturns = getLicenceReturns;
exports.isXmlUpload = isXmlUpload;
exports.groupReturnsByYear = groupReturnsByYear;
exports.mergeReturnsAndLicenceNames = mergeReturnsAndLicenceNames;
exports.getLatestVersion = getLatestVersion;
exports.hasGallons = hasGallons;
exports.getReturnsViewData = getReturnsViewData;
exports.getReturnTotal = getReturnTotal;
exports.getViewData = getViewData;
exports.isReturnPastDueDate = isReturnPastDueDate;
exports.getRedirectPath = getRedirectPath;
exports.isReturnId = isReturnId;
exports.getSuffix = getSuffix;
exports.getBadge = getBadge;
exports.mapReturns = mapReturns;
exports.endReadingKey = endReadingKey;
