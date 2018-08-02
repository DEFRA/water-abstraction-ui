/* eslint new-cap: "warn" */
const Boom = require('boom');

const {
  getLicenceNumbers,
  getLicenceReturns,
  groupReturnsByYear,
  mergeReturnsAndLicenceNames,
  getUnit,
  getReturnData
} = require('./helpers');

/**
 * Gets and displays a list of returns for the current user,
 * grouped by year
 */
const getReturns = async (request, h) => {
  const { page } = request.query;
  const { entity_id: entityId } = request.auth.credentials;

  // Get documents from CRM
  const documents = await getLicenceNumbers(entityId);
  const licenceNumbers = documents.map(row => row.system_external_id);

  const { data, pagination } = await getLicenceReturns(licenceNumbers, page);

  const returns = groupReturnsByYear(mergeReturnsAndLicenceNames(data, documents));

  const view = {
    ...request.view,
    returns,
    pagination
  };

  return h.view('water/returns/index', view);
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
  const [ documentHeader ] = await getLicenceNumbers(entityId, licenceNumber);

  if (!documentHeader) {
    throw new Boom.forbidden(`Access denied return ${id} for entity ${entityId}`);
  }

  const view = {
    ...request.view,
    ...data,
    pageTitle: `Abstraction return for ${licenceNumber}`,
    documentHeader,
    unit: getUnit(data.lines)
  };
  return h.view('water/returns/return', view);
};

module.exports = {
  getReturns,
  getReturn
};
