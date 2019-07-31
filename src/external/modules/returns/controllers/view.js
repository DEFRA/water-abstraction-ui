/* eslint new-cap: "warn" */
const Boom = require('@hapi/boom');

const helpers = require('../lib/helpers');

const WaterReturn = require('shared/modules/returns/models/WaterReturn');

const { getEditButtonPath } = require('../lib/return-path');

const services = require('../../../lib/connectors/services');

/**
 * Gets and displays a list of returns for the current user,
 * grouped by year
 */
const getReturns = async (request, h) => {
  const view = await helpers.getReturnsViewData(request);
  return h.view('nunjucks/returns/index.njk', view, { layout: false });
};

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
  view.pageTitle = `Returns for ${view.document.system_external_id}`;
  view.paginationUrl = `/licences/${documentId}/returns`;

  return h.view('water/returns/licence', view);
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
  const model = new WaterReturn(data);

  // Load CRM data to check access
  const { licenceNumber } = data;

  // Load licence from CRM to check user has access
  const [ documentHeader ] = await helpers.getLicenceNumbers(request, { system_external_id: licenceNumber, includeExpired: false });

  const canView = documentHeader && data.isCurrent && model.metadata.isCurrent;

  if (!canView) {
    throw Boom.forbidden(`Access denied return ${id} for entity ${entityId}`);
  }

  const view = {
    total: model.getReturnTotal(),
    ...request.view,
    return: model.toObject(),
    lines: model.getLines(true),
    pageTitle: `Abstraction return for ${licenceNumber}`,
    documentHeader,
    editButtonPath: getEditButtonPath(data, request),
    showVersions: false,
    isVoid: data.status === 'void',
    endReading: model.meter.getEndReading()
  };

  return h.view('water/returns/return', view);
};

module.exports = {
  getReturns,
  getReturnsForLicence,
  getReturn
};
