'use strict';

const viewLicenceLib = require('../../../lib/view-licence-config');

/**
 * Get a list of bills for a particular licence
 * @param {String} request.params.documentId - the CRM doc ID for the licence
 * @param {Number} request.query.page - the page number for paginated results
 */
const getBillsForLicence = async (request, h) => {
  const { licenceId } = request.params;
  const { page } = request.query;
  const { document } = request.pre;

  const { data, pagination } = await viewLicenceLib.getLicenceInvoices(licenceId, page);

  return h.view('nunjucks/billing/bills', {
    ...request.view,
    pageTitle: document.metadata.Name,
    caption: document.system_external_id,
    tableCaption: 'All sent bills',
    bills: data,
    pagination,
    licenceId,
    back: `/licences/${licenceId}#bills`
  });
};

module.exports = {
  getBillsForLicence
};
