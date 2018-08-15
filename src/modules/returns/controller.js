/* eslint new-cap: "warn" */
const Boom = require('boom');

const {
  getLicenceNumbers,
  // getUnit,
  hasGallons,
  getReturnData,
  getReturnsViewData
} = require('./helpers');

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
  view.pageTitle = `Returns for ${view.document.system_external_id}`;
  return h.view('water/returns/licence', view);
};

/**
 * Gets a single return by ID
 * @param {String} request.query.id - the return ID to display
 */
const getReturn = async (request, h) => {
  const { id } = request.query;
  const { entity_id: entityId } = request.auth.credentials;

  // Load return data
  const data = await getReturnData(id);

  // Load CRM data to check access
  const { licence_ref: licenceNumber } = data.return;

  // Load licence from CRM to check user has access
  const [ documentHeader ] = await getLicenceNumbers(entityId, {system_external_id: licenceNumber});

  if (!documentHeader) {
    throw new Boom.forbidden(`Access denied return ${id} for entity ${entityId}`);
  }

  const view = {
    ...request.view,
    ...data,
    pageTitle: `Abstraction return for ${licenceNumber}`,
    documentHeader
  };
  return h.view('water/returns/return', view);
};

module.exports = {
  getReturns,
  getReturnsForLicence,
  getReturn
};
