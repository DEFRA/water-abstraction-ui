/* eslint new-cap: "warn" */
const Boom = require('@hapi/boom');
const { get } = require('lodash');

const { isInternal } = require('../../../lib/permissions');

const helpers = require('../lib/helpers');

const {
  getLinesWithReadings
} = require('../lib/return-helpers');

const { getEditButtonPath } = require('../lib/return-path');

const services = require('../../../lib/connectors/services');

/**
 * Get a list of returns for a particular licence
 * @param {String} request.params.documenId - the CRM doc ID for the licence
 * @param {Number} request.query.page - the page number for paginated results
 */
const getReturnsForLicence = async (request, h) => {
  const view = await helpers.getReturnsViewData(request);

  const { documentId } = request.params;

  if (!view.document) {
    throw Boom.notFound(`Document ${documentId} not found - entity ${request.defra.entityId} may not have the correct roles`);
  }
  view.pageTitle = `Returns for licence number ${view.document.system_external_id}`;
  view.paginationUrl = `/licences/${documentId}/returns`;
  view.back = `/licences/${documentId}`;
  view.backText = `Licence number ${view.document.system_external_id}`;

  return h.view('nunjucks/returns/licence.njk', view, { layout: false });
};

/**
 * Gets a single return by ID
 * @param {String} request.query.id - the return ID to display
 */
const getReturn = async (request, h) => {
  const { id, version } = request.query;
  const { entityId } = request.defra;

  // Load return data
  const data = await services.water.returns.getReturn(id, version);

  const lines = getLinesWithReadings(data);

  // Load CRM data to check access
  const { licenceNumber } = data;

  // Load licence from CRM to check user has access
  const isInternalUser = isInternal(request);
  const [ documentHeader ] = await helpers.getLicenceNumbers(request, { system_external_id: licenceNumber, includeExpired: isInternalUser });

  const canView = documentHeader && (isInternalUser || (data.isCurrent && data.metadata.isCurrent));

  if (!canView) {
    throw Boom.forbidden(`Access denied return ${id} for entity ${entityId}`);
  }

  const showVersions = isInternal && get(data, 'versions[0].email');

  const view = {
    total: helpers.getReturnTotal(data),
    ...request.view,
    return: data,
    lines,
    pageTitle: `Abstraction return for ${licenceNumber}`,
    documentHeader,
    editButtonPath: getEditButtonPath(data, request),
    showVersions,
    isVoid: data.status === 'void',
    endReading: get(data, `meters[0].readings.${helpers.endReadingKey(data)}`)
  };

  return h.view('water/returns/return', view);
};

module.exports = {
  getReturnsForLicence,
  getReturn
};
