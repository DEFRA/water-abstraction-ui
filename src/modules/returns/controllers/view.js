/* eslint new-cap: "warn" */
const Boom = require('boom');
const { get, findLastKey } = require('lodash');

const { isInternal } = require('../../../lib/permissions');

const {
  getLicenceNumbers,
  getReturnsViewData,
  getReturnTotal,
  endReadingKey
} = require('../lib/helpers');

const {
  getLinesWithReadings
} = require('../lib/return-helpers');

const { getEditButtonPath } = require('../lib/return-path');

const { returns } = require('../../../lib/connectors/water');

/**
 * Gets and displays a list of returns for the current user,
 * grouped by year
 */
const getReturns = async (request, h) => {
  const view = await getReturnsViewData(request);
  return h.view('water/returns/index', view);
};

/**
 * Get a list of returns for a particular licence
 * @param {String} request.params.documenId - the CRM doc ID for the licence
 * @param {Number} request.query.page - the page number for paginated results
 */
const getReturnsForLicence = async (request, h) => {
  const view = await getReturnsViewData(request);

  const { documentId } = request.params;

  if (!view.document) {
    throw Boom.notFound(`Document ${documentId} not found - entity ${request.auth.credentials.entity_id} may not have the correct roles`);
  }
  view.pageTitle = `Returns for ${view.document.system_external_id}`;
  view.paginationUrl = `${request.view.isAdmin ? '/admin' : ''}/licences/${documentId}/returns`;

  return h.view('water/returns/licence', view);
};

/**
 * Gets a single return by ID
 * @param {String} request.query.id - the return ID to display
 */
const getReturn = async (request, h) => {
  const { id, version } = request.query;
  const { entity_id: entityId } = request.auth.credentials;

  // Load return data
  const data = await returns.getReturn(id, version);

  const lines = getLinesWithReadings(data);

  // Load CRM data to check access
  const { licenceNumber } = data;

  // Load licence from CRM to check user has access
  const isInternalUser = isInternal(request);
  const [ documentHeader ] = await getLicenceNumbers(request, { system_external_id: licenceNumber });

  const canView = documentHeader && (isInternalUser || (data.isCurrent && data.metadata.isCurrent));

  if (!canView) {
    throw Boom.forbidden(`Access denied return ${id} for entity ${entityId}`);
  }

  const showVersions = isInternal && get(data, 'versions[0].email');

  const view = {
    total: getReturnTotal(data),
    ...request.view,
    return: data,
    lines,
    pageTitle: `Abstraction return for ${licenceNumber}`,
    documentHeader,
    editButtonPath: getEditButtonPath(data, request),
    showVersions,
    isVoid: data.status === 'void',
    endReading: get(data, `meters[0].readings.${endReadingKey(data)}`)
  };

  return h.view('water/returns/return', view);
};

module.exports = {
  getReturns,
  getReturnsForLicence,
  getReturn
};
