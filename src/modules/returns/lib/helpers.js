/* eslint new-cap: "warn" */
const Boom = require('boom');
const moment = require('moment');
const { get } = require('lodash');
const titleCase = require('title-case');

const { isInternal: isInternalUser } = require('../../../lib/permissions');
const { documents } = require('../../../lib/connectors/crm');
const { returns, versions } = require('../../../lib/connectors/returns');
const config = require('../../../../config');
const { getWaterLicence } = require('../../../lib/connectors/crm/documents');

const { getReturnPath } = require('./return-path');

/**
 * Gets all licences from the CRM that can be viewed by the supplied entity ID
 * @param {Object} request - current HAPI request
 * @param {Object} filter - additional filter params
 * @return {Promise} - resolved with array of objects with system_external_id (licence number) and document_name
 */
const getLicenceNumbers = (request, filter = {}) => {
  const f = documents.createFilter(request, filter);
  console.log(f);
  const sort = {};
  const columns = ['system_external_id', 'document_name', 'document_id'];
  return documents.findAll(f, sort, columns);
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

  const columns = ['return_id', 'licence_ref', 'start_date', 'end_date', 'metadata', 'status', 'received_date', 'due_date'];

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

/**
 * Whether the user of the current request can edit the supplied return row
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} return - the return row from the return service or water service model
 * @param {String} [today] - allows today's date to be set for test purposes, defaults to current timestamp
 * @return {Boolean}
 */
// const canEdit = (permissions, ret, today) => {
//   const showFutureReturns = get(config, 'returns.showFutureReturns', false);
//   const endDate = ret.endDate || ret.end_date;
//   const { status } = ret;
//   const isAfterSummer2018 = moment(endDate).isSameOrAfter('2018-10-31');
//   const canSubmit = hasPermission('returns.submit', permissions);
//   const canEdit = hasPermission('returns.edit', permissions);
//   const isPast = moment(today).isSameOrAfter(endDate);
//
//   return isAfterSummer2018 &&
//     (
//       (canEdit) ||
//       (canSubmit && (status === 'due') && (showFutureReturns || isPast))
//     );
// };

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

  const isInternal = isInternalUser(request.permissions);

  const documents = await getLicenceNumbers(request, filter);
  const licenceNumbers = documents.map(row => row.system_external_id);

  const view = {
    ...request.view,
    documents,
    document: documentId ? documents[0] : null,
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
 * Redirects to admin path if internal user
 * @param {Object} request - HAPI request instance
 * @param {String} path - the path to redirect to without '/admin'
 * @return {String} path with /admin if internal user
 */
const getScopedPath = (request, path) => isInternalUser(request) ? `/admin${path}` : path;

/**
 * Get common view data used by many controllers
 * @param {Object} HAPI request instance
 * @param {Object} data - the return model
 * @return {Promise} resolves with view data
 */
const getViewData = async (request, data) => {
  const documentHeader = await getWaterLicence(data.licenceNumber);
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
    return `/admin/returns/select-licence?formatId=${formatId}`;
  }
  return status === 'completed' ? `/admin/returns/return?id=${returnId}` : `/admin/return/internal?returnId=${returnId}`;
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
    due: 'success',
    received: 'completed',
    completed: 'completed',
    void: 'void'
  };

  return {
    text: titleCase(viewStatus),
    status: styles[viewStatus]
  };
};

module.exports = {
  getLicenceNumbers,
  getLicenceReturns,
  groupReturnsByYear,
  mergeReturnsAndLicenceNames,
  getLatestVersion,
  hasGallons,
  getReturnsViewData,
  getReturnTotal,
  getScopedPath,
  getViewData,
  isReturnPastDueDate,
  getRedirectPath,
  isReturnId,
  getSuffix,
  getBadge,
  mapReturns
};
