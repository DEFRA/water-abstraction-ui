/* eslint new-cap: "warn" */
const Boom = require('@hapi/boom');
const { get } = require('lodash');
const helpers = require('../lib/helpers');
const returnHelpers = require('../lib/return-helpers');

const { getEditButtonPath } = require('internal/lib/return-path');

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

  return h.view('nunjucks/returns/licence', view);
};

/**
 * Gets a single return by ID
 * @param {String} request.query.id - the return ID to display
 */
const getReturn = async (request, h) => {
  const { licence } = request.pre;
  const { id, version } = request.query;
  const { entityId } = request.defra;

  // Load return data
  const data = await services.water.returns.getReturn(id, version);

  const lines = returnHelpers.getLinesWithReadings(data);

  // Load CRM data to check access
  const { licenceNumber } = data;

  // Load licence from CRM to check user has access
  const [ documentHeader ] = await helpers.getNewTaggingLicenceNumbers(request, { system_external_id: licenceNumber, includeExpired: true });

  if (!documentHeader) {
    throw Boom.forbidden(`Access denied return ${id} for entity ${entityId}`);
  }

  const showVersions = get(data, 'versions[0].email');

  const view = {
    total: helpers.getReturnTotal(data),
    ...request.view,
    data,
    lines,
    pageTitle: `Abstraction return for ${licenceNumber}`,
    documentHeader,
    editButtonPath: getEditButtonPath(data, request),
    showVersions,
    isVoid: data.status === 'void',
    endReading: get(data, `meters[0].readings.${helpers.endReadingKey(data)}`),
    links: {
      licence: `/licences/${licence.id}`
    }
  };

  return h.view('nunjucks/returns/return', view);
};

module.exports = {
  getReturnsForLicence,
  getReturn
};
