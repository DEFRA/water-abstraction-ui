'use strict';

const services = require('./connectors/services');
const { hasScope } = require('./permissions');
const { chargeVersionWorkflowReviewer, chargeVersionWorkflowEditor } = require('./constants').scope;

const isChargeVersionWorkflowEditorOrReviewer = request =>
  hasScope(request, [chargeVersionWorkflowEditor, chargeVersionWorkflowReviewer]);

/**
   * Loads licence data using the supplied method on the water service connector
   * @param {String} method
   * @param {String} documentId - crm_v1 document ID
   * @param {Object} request - hapi request
   * @return {Promise<Object>}
   */
const getLicenceData = async (method, documentId, request) => {
  if (method === 'getChargeVersionsByDocumentId') {
    // temporary work around until the licence page is updated to use the licenceId
    const { data: licence } = await services.water.licences.getByDocumentId(documentId, { includeExpired: true });

    // Only fetch charge version workflows if authenticated user has sufficient scope
    let chargeVersionWorkflows = [];
    if (isChargeVersionWorkflowEditorOrReviewer(request)) {
      const { data } = await services.water.chargeVersionWorkflows.getChargeVersionWorkflowsForLicence(licence.id);
      chargeVersionWorkflows = data;
    }

    const { error, data: chargeVersions } = await services.water.chargeVersions[method](documentId);
    return {
      error,
      data: [
        ...Array.isArray(chargeVersionWorkflows) ? chargeVersionWorkflows : [],
        ...Array.isArray(chargeVersions) ? chargeVersions : []
      ] };
  }
  return services.water.licences[method](documentId, { includeExpired: true });
};

exports.getLicenceData = getLicenceData;
