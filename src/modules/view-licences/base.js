const Boom = require('boom');
const CRM = require('../../lib/connectors/crm');
const { mapSort, mapFilter } = require('./helpers');

/**
 * Base get licences route handler - used by both front-end and admin
 * handlers
 */
async function getLicences (request, reply) {
  const { entity_id: entityId } = request.auth.credentials;
  const { page } = request.query;
  const sort = mapSort(request.query);
  const filter = mapFilter(entityId, request.query);

  // Get licences from CRM
  const { data, error, pagination } = await CRM.documents.getLicences(filter, sort, {
    page,
    perPage: 50
  });
  if (error) {
    reply(Boom.badImplementation('CRM error', error));
  }

  return reply.view('water/view-licences/licences', {
    ...request.view,
    licenceData: data,
    pagination
  });
}

module.exports = {
  getLicences
};
