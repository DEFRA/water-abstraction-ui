const { set } = require('lodash');
const Boom = require('boom');
const { throwIfError } = require('@envage/hapi-pg-rest-api');
const services = require('../../lib/connectors/services');

/**
 * Loads the CRM document, and also for external users, checks the document
 * matches their currently selected company
 * @param  {Object}  request - HAPI request
 * @param {String} documentId - the CRM document ID
 * @param  {Object}  h       - HAPI reply interface
 * @return {Promise}         resolves with h.continue
 */
const preLoadDocument = async (request, h) => {
  // Create filter to load document
  const { documentId } = request.params;
  const filter = {
    document_id: documentId
  };

  // Load document from CRM
  const { error, data: [ documentHeader ] } = await services.crm.documents.findMany(filter);

  throwIfError(error);
  if (!documentHeader) {
    throw Boom.notFound(`Document ${documentId} not found`);
  }

  // Attach document header to request and return
  request.documentHeader = documentHeader;
  return h.continue;
};

/**
 * Gets data specific to internal view of licence
 * - Document verifications
 * - Primary user of licence
 */
const preInternalView = async (request, h) => {
  const { documentId } = request.params;
  const primaryUser = await services.water.licences.getPrimaryUserByDocumentId(documentId);
  const verifications = await services.crm.documentVerifications.getUniqueDocumentVerifications(documentId);
  set(request, 'view.primaryUser', primaryUser);
  set(request, 'view.verifications', verifications);
  return h.continue;
};

exports.preLoadDocument = preLoadDocument;
exports.preInternalView = preInternalView;
