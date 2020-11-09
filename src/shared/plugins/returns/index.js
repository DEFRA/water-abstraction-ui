const Boom = require('boom');
const { get, set } = require('lodash');
const Joi = require('joi');

/**
 * Checks whether the current user may access the return
 * @param  {Object}  request - HAPI request
 * @param  {Object}  documentHeader - CRM doc header record
 * @return {Promise}         resolves with boolean - true if can access
 */
const checkAccess = (request, documentHeader) => {
  const companyId = get(request, 'defra.companyId');

  if (!documentHeader.company_entity_id) {
    throw Boom.unauthorized(`Access denied to edit return - document not registered`);
  }
  if (!companyId) {
    throw Boom.unauthorized(`Access denied to edit return - no company selected`);
  }
  if (documentHeader.company_entity_id !== companyId) {
    throw Boom.unauthorized(`Access denied to edit return`);
  }
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
  const licenceNumber = returnId.split(':')[2];
  const { pluginOptions } = h.realm;

  const documentHeader = await pluginOptions.getDocumentHeader(licenceNumber, pluginOptions.includeExpired);
  if (!documentHeader) {
    throw Boom.notFound(`Licence ${licenceNumber} not found in CRM`);
  }

  if (pluginOptions.checkAccess) {
    checkAccess(request, documentHeader);
  }

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
    Joi.assert(options, {
      getDocumentHeader: Joi.func().required(),
      checkAccess: Joi.boolean().required(),
      includeExpired: Joi.boolean().default(false)
    });

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
