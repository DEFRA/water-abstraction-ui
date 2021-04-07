'use strict';

const viewLicenceLib = require('../../../lib/view-licence-config');
const services = require('../../../lib/connectors/services');

/**
 * Get a list of bills for a particular licence
 * @param {String} request.params.documentId - the CRM doc ID for the licence
 * @param {Number} request.query.page - the page number for paginated results
 */
const getBillsForLicence = async (request, h) => {
  const { licenceId } = request.params;
  const { page } = request.query;

  const document = await services.water.licences.getDocumentByLicenceId(licenceId);

  const { data, pagination } = await viewLicenceLib.getLicenceInvoices(licenceId, page);

  return h.view('nunjucks/billing/bills', {
    ...request.view,
    pageTitle: document.metadata.Name,
    caption: document.system_external_id,
    tableCaption: 'All sent bills',
    bills: data,
    pagination,
    licenceId,
    back: `/licences/${document.document_id}#bills`
  });
};

module.exports = {
  getBillsForLicence
};
