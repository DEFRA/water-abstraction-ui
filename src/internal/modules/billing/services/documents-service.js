const services = require('internal/lib/connectors/services');

/**
 * Resolves with a map of CRM document IDs keyed by licence number
 * @param {Array<String>} licenceNumbers
 * @return {Promise<Map>}
 */
const getDocumentIds = async licenceNumbers => {
  const { data } = await services.crm.documents.findMany(
    {
      system_external_id: { $in: licenceNumbers }
    },
    null,
    { page: 1, perPage: Number.MAX_SAFE_INTEGER },
    ['document_id', 'system_external_id']
  );
  return new Map(
    data.map(doc => [doc.system_external_id, doc.document_id])
  );
};

exports.getDocumentIds = getDocumentIds;
