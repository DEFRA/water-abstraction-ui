const CRM = require('../../lib/connectors/crm');
const IDM = require('../../lib/connectors/idm');
const { mapSort, mapFilter } = require('./helpers');

/**
 * Base get licences route handler - used by both front-end and admin
 * handlers
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} [request.query] - GET query params
 * @param {String} [request.query.emailAddress] - the email address to filter on
 * @param {String} [request.query.licenceNumber] - the licence number to search on
 * @param {String} [request.query.sort] - the field to sort on licenceNumber|name
 * @param {Number} [request.query.direction] - sort direction +1 : asc, -1 : desc
 * @param {Object} h - the HAPI response toolkit
 */
async function getLicences (request, h) {
  const viewName = 'water/view-licences/licences';

  if (request.formError) {
    return h.view(viewName, request.view);
  }

  const { companyId } = request.auth.credentials;
  const { page, emailAddress } = request.query;
  const sort = mapSort(request.query);
  const filter = mapFilter(companyId, request.query);

  // Check if user exists
  if (emailAddress) {
    const { data } = await IDM.getUserByEmail(emailAddress);
    request.view.error = data.length === 0;
  }

  // Get licences from CRM
  const { data, error, pagination } = await CRM.documents.findMany(filter, sort, {
    page,
    perPage: 50
  });

  if (error) {
    throw error;
  }

  return h.view(viewName, {
    ...request.view,
    licenceData: data,
    pagination
  });
}

module.exports = {
  getLicences
};
