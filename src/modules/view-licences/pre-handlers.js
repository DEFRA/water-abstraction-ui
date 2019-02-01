const { get, set } = require('lodash');
const Boom = require('boom');
const { throwIfError } = require('@envage/hapi-pg-rest-api');
const CRM = require('../../lib/connectors/crm');
const licenceConnector = require('../../lib/connectors/water-service/licences');

const getDocumentFilter = (request) => {
  return {
    entity_id: get(request, 'auth.credentials.entity_id'),
    document_id: get(request, 'params.licence_id')
  };
};

/**
 * Pre handler for external users only - checks user can access requested document
 * @param  {Object}  request - HAPI request
 * @param  {Object}  h       - HAPI response toolkit
 * @return {Promise}         Resolves with continue response if OK
 */
const preAccessControl = async (request, h) => {
  // External user must be able to view licence via CRM call with entity ID
  const filter = getDocumentFilter(request);
  const { error, data: [documentHeader] } = await CRM.documents.findMany(filter);
  throwIfError(error);
  if (!documentHeader) {
    throw Boom.unauthorized(`Document ${filter.document_id} not found for entity ${filter.entity_id}`);
  }
  return h.continue;
};

/**
 * Gets data specific to internal view of licence
 * - Document verifications
 * - Primary user of licence
 */
const preInternalView = async (request, h) => {
  const { licence_id: documentId } = request.params;
  const primaryUser = await licenceConnector.getLicencePrimaryUserByDocumentId(documentId);
  const verifications = await CRM.getDocumentVerifications(documentId);
  set(request, 'view.primaryUser', primaryUser);
  set(request, 'view.verifications', verifications);
  return h.continue;
};

module.exports = {
  preAccessControl,
  preInternalView
};
