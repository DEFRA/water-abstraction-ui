'use strict';

const { pick, set } = require('lodash');
const moment = require('moment');

const mappers = require('./lib/mappers');
const { scope } = require('../../lib/constants');
const { hasScope } = require('../../lib/permissions');
const { featureToggles } = require('../../config');
const returnsMapper = require('../../lib/mappers/returns');

const getDocumentId = doc => doc.document_id;

const getIsChargeInformationEditable = request => {
  const { licence } = request.pre;
  const isLicenceChargeInformationEditable = moment(licence.endDate).isAfter(moment().subtract(6, 'years')) || licence.endDate === null;
  const isRequiredScope = hasScope(request, scope.billing);
  return isLicenceChargeInformationEditable && isRequiredScope;
};

/**
 * Main licence summary page
 * All data is loaded via shared pre-handlers
 *
 * @param {String} request.params.licenceId - licence guid
 */
const getLicenceSummary = async (request, h) => {
  const { licenceId } = request.params;
  const { agreements, licence, returns, document } = request.pre;

  // Get CRM v1 doc ID
  const documentId = getDocumentId(document);

  const isChargeInformationEditable = getIsChargeInformationEditable(request);

  const chargeVersions = mappers.mapChargeVersions(
    request.pre.chargeVersions,
    request.pre.chargeVersionWorkflows,
    {
      licenceId,
      isChargeInformationEditable
    }
  );

  const view = {
    ...request.view,
    pageTitle: `Licence ${licence.licenceNumber}`,
    featureToggles,
    licenceId,
    documentId,
    ...pick(request.pre, ['licence', 'bills', 'notifications', 'primaryUser', 'summary']),
    chargeVersions,
    agreements: mappers.mapLicenceAgreements(agreements),
    returns: {
      pagination: returns.pagination,
      data: returnsMapper.mapReturns(returns.data, request)
    },
    links: {
      bills: `/licences/${licenceId}/bills`,
      returns: `/licences/${documentId}/returns`
    },
    validityMessage: mappers.getValidityNotice(licence),
    back: '/licences'
  };

  if (isChargeInformationEditable) {
    Object.assign(view.links, {
      bills: `/licences/${licenceId}/bills`,
      setupCharge: `/licences/${licenceId}/charge-information/create`,
      makeNonChargeable: `/licences/${licenceId}/charge-information/non-chargeable-reason?start=1`,
      addAgreement: `/licences/${licenceId}/agreements/select-type`
    });
  }

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
