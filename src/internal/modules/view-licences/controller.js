'use strict';

const { pick } = require('lodash');

const mappers = require('./lib/mappers');
const { scope } = require('../../lib/constants');
const { hasScope } = require('../../lib/permissions');
const { featureToggles } = require('../../config');

const getDocumentId = doc => doc.document_id;

/**
 * Main licence summary page
 * All data is loaded via shared pre-handlers
 *
 * @param {String} request.params.licenceId - licence guid
 */
const getLicenceSummary = async (request, h) => {
  const { licenceId } = request.params;
  const { agreements, chargeVersions, chargeVersionWorkflows, licence, returns, document, summary } = request.pre;

  // Get CRM v1 doc ID
  const documentId = getDocumentId(document);

  const view = {
    ...request.view,
    pageTitle: `Licence ${licence.licenceNumber}`,
    featureToggles,
    summary,
    licenceId,
    documentId,
    ...pick(request.pre, ['licence', 'bills', 'notifications', 'primaryUser']),
    chargeVersions: mappers.mapChargeVersions(chargeVersions, chargeVersionWorkflows),
    agreements: mappers.mapLicenceAgreements(agreements),
    returns: mappers.mapReturns(request, returns),
    links: {
      bills: `/licences/${licenceId}/bills`,
      returns: `/licences/${documentId}/returns`,
      addAgreement: `/licences/${licenceId}/agreements/select-type`
    },
    isChargingUser: hasScope(request, scope.charging),
    validityMessage: mappers.getValidityNotice(licence),
    back: '/licences'
  };

  return h.view('nunjucks/view-licences/licence.njk', view);
};

/**
 * Get a list of bills for a particular licence
 * @param {String} request.params.documentId - the CRM doc ID for the licence
 * @param {Number} request.query.page - the page number for paginated results
 */
const getBillsForLicence = async (request, h) => {
  const { licenceId } = request.params;
  const { document } = request.pre;

  const { data, pagination } = request.pre.bills;

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

exports.getLicenceSummary = getLicenceSummary;
exports.getBillsForLicence = getBillsForLicence;
