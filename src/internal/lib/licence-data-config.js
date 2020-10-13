const services = require('./connectors/services');

exports.getLicenceData = async (method, documentId) => {
  if (method === 'getChargeVersionsByDocumentId') {
    // temporary work around until the licence page is updated to use the licenceId
    const { data: licence } = await services.water.licences.getByDocumentId(documentId);
    const chargeVersionWorkflows = await services.water.chargeVersionWorkflows.getChargeVersionWorkflowsForLicence(licence.id);
    const { error, data: chargeVersions } = await services.water.chargeVersions[method](documentId);
    return {
      error,
      data: [
        ...chargeVersionWorkflows.map(workflow => ({ ...workflow, status: 'review' })),
        ...chargeVersions
      ] };
  }
  return services.water.licences[method](documentId, { includeExpired: true });
};
