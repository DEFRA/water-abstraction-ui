const Boom = require('boom');
// const { documents } = require('../../lib/connectors/crm');

const { returns, lines } = require('../../lib/connectors/returns');

const { getLicenceNumbers, getLicenceReturns, groupReturnsByYear, mergeReturnsAndLicenceNames, getLatestVersion } = require('./helpers');

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

  console.log(JSON.stringify(returns, null, 2));

  const view = {
    ...request.view,
    returns,
    pagination
  };

  return h.view('water/returns/index', view);
};

/**
 * Gets a single return by ID
 */
const getReturn = async (request, h) => {
  const { id } = request.query;

  // Load return
  const { data, error: returnError } = await returns.findMany({ return_id: id });
  if (returnError) {
    throw new Boom.badImplementation(returnError);
  }

  // @TODO check permission.  Must be either a primary user of the licence company
  // or a user of the company with returns permission set
  console.log(request.credentials.auth.roles);

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
    return: data[0],
    pageTitle: `Abstraction return for ${data[0].licence_ref}`,
    lines: linesData
  };
  return h.view('water/returns/return', view);
};

module.exports = {
  getReturns,
  getReturn
};
