const Boom = require('boom');
/* eslint new-cap: "warn" */

const { returns, lines } = require('../../lib/connectors/returns');

const { getLicenceNumbers, getLicenceReturns, groupReturnsByYear, mergeReturnsAndLicenceNames, getLatestVersion, getUnit } = require('./helpers');

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

  // Load return
  const { data: [returnData], error: returnError } = await returns.findMany({ return_id: id });
  if (returnError) {
    throw new Boom.badImplementation(returnError);
  }
  if (!returnData) {
    throw new Boom.notFound(`Return ${id} not found`);
  }

  const { licence_ref: licenceNumber } = returnData;

  // Load licence from CRM to check user has access
  const [ documentHeader ] = await getLicenceNumbers(entityId, licenceNumber);

  if (!documentHeader) {
    throw new Boom.forbidden(`Access denied return ${id} for entity ${entityId}`);
  }

  // Find lines for version
  const version = await getLatestVersion(id);
  const filter = {
    version_id: version.version_id
  };
  const sort = {
    start_date: 1
  };
  const { data: linesData, error: linesError } = await lines.findMany(filter, sort);
  if (linesError) {
    throw new Boom.badImplementation(linesError);
  }

  const view = {
    ...request.view,
    return: returnData,
    pageTitle: `Abstraction return for ${licenceNumber}`,
    lines: linesData,
    documentHeader,
    unit: getUnit(linesData)
  };
  return h.view('water/returns/return', view);
};

module.exports = {
  getReturns,
  getReturn
};
