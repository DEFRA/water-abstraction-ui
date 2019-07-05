const Boom = require('boom');
const { get } = require('lodash');
const { throwIfError } = require('@envage/hapi-pg-rest-api');

const sessionHelpers = require('./lib/session-helpers');
const helpers = require('./lib/helpers');
const services = require('../../lib/connectors/services');
const returnPath = require('./lib/return-path');
const permissions = require('../../lib/permissions');
const config = require('../../config');

/**
 * Redirects user to view return rather than edit
 */
const redirectToReturn = (request, h) => {
  const { returnId } = request.query;
  const path = `/returns/return?id=${returnId}`;
  return h.redirect(path).takeover();
};

/**
 * Loads the corresponding CRM document for the return specified in the
 * supplied data, if it belongs to the company entity ID in the current
 * request
 * @param  {Object}  request - current HAPI request
 * @param  {Object}  data    - return model data
 * @return {Promise}         - resolves with object for CRM document loaded
 */
const loadCRMDocument = async (request, data) => {
  const filter = {
    system_external_id: data.licenceNumber,
    company_entity_id: get(request, 'defra.companyId'),
    regime_entity_id: config.crm.regimes.water.entityId
  };
  const pagination = { page: 1, perPage: 1 };
  const columns = ['document_id'];
  const { data: [ document ], error } =
    await services.crm.documents.findMany(filter, null, pagination, columns);
  throwIfError(error);
  return document;
};

/**
 * Checks whether the current user may access the return
 * @param  {Object}  request - HAPI request
 * @param  {Object}  data    - return model data
 * @return {Promise}         resolves with boolean - true if can access
 */
// const checkAccess = async (request, data) => {
//   // Internal user
//   if (returnPath.isInternalEdit(data, request)) {
//     return true;
//   }
//   if (permissions.isExternalReturns(request)) {
//     const document = await loadCRMDocument(request, data);
//     if (document) {
//       return true;
//     }
//   }
//   return false;
// };

/**
 * Gets return data for the current request.
 * If the load flag is set on the route configuration, then fresh return
 * data is loaded from the water service and placed in the session.
 * Otherwise the data is loaded from the session.
 * @param  {Object}  request - HAPI request
 * @return {Promise}         - resolves with return model data
 */
const getReturnData = async (request) => {
  const { returnId } = request.query;
  // Load fresh data from water service if flag set in route config
  const isLoadRoute = get(request, 'route.settings.plugins.returns.load', false);
  if (isLoadRoute) {
    const data = await services.water.returns.getReturn(returnId);
    const canAccess = await checkAccess(request, data);
    if (!canAccess) {
      throw Boom.unauthorized(`Permission denied to submit/edit return`, data);
    }
    // Bump return version number
    data.versionNumber = (data.versionNumber || 0) + 1;
    // Save to session
    sessionHelpers.saveSessionData(request, data);
  }

  return sessionHelpers.getSessionData(request);
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

  try {
    const data = await getReturnData(request);
    const view = await helpers.getViewData(request, data);

    // If no return ID in session, then throw error
    if (returnId !== data.returnId) {
      throw Boom.notFound(`Session return ${data.returnId} does match return in query ${returnId}`);
    }

    request.returns = {
      data,
      view,
      isInternal: permissions.isInternal(request)
    };
  } catch (err) {
    // Return data was not found in session
    if (returnId) {
      return redirectToReturn(request, h);
    }

    throw err;
  }

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
