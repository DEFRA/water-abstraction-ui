const Boom = require('@hapi/boom');
const { get, set } = require('lodash');
const services = require('../../lib/connectors/services');

/**
 * Checks whether the current user may access the return
 * @param  {Object}  request - HAPI request
 * @param  {Object}  documentHeader - CRM doc header record
 * @return {Promise}         resolves with boolean - true if can access
 */
const checkAccess = (request, documentHeader) => {
  if (documentHeader && (documentHeader.company_entity_id === request.defra.companyId)) {
    return;
  }
  const params = {
    returnId: request.query.returnId,
    defra: request.defra
  };
  throw Boom.unauthorized(`Access denied to edit return`, params);
};

/**
 * Pre handler:
 * - loads return from water service if requested in route options
 * - otherwise gets current return model from session
 * - checks user can access return when loading
 * - gets view data
 * - sets data in request.returns which is picked up in controllers
 */
const preHandler = async (request, h) => {
  const { returnId } = request.query;

  const [, , licenceNumber] = returnId.split(':');

  const documentHeader = await services.crm.documents.getWaterLicence(licenceNumber);

  checkAccess(request, documentHeader);

  // Add document header data to view
  set(request, 'view.documentHeader', documentHeader);

  return h.continue;
};

const _handler = async (request, h) => {
  const isEnabled = get(request, 'route.settings.plugins.returns', false);
  return isEnabled ? preHandler(request, h) : h.continue;
};

const returnsPlugin = {
  register: (server, options) => {
    server.ext({
      type: 'onPreHandler',
      method: _handler
    });
  },

  pkg: {
    name: 'returnsPlugin',
    version: '2.0.0'
  }
};

module.exports = returnsPlugin;
module.exports._handler = _handler;
