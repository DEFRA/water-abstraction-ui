'use strict';

const { pick, uniqWith, isEqual } = require('lodash');
const moment = require('moment');

const mappers = require('./lib/mappers');
const { scope } = require('../../lib/constants');
const { hasScope } = require('../../lib/permissions');
const { featureToggles } = require('../../config');
const returnsMapper = require('../../lib/mappers/returns');

const getDocumentId = doc => doc.document_id;

const getIsLicenceChargeVersionsEditingEnabled = licence =>
  licence.endDate === null || moment(licence.endDate).isAfter(moment().subtract(6, 'years'));

const getPermissions = request => {
  const isLicenceChargeInformationEditable = getIsLicenceChargeVersionsEditingEnabled(request.pre.licence);
  return {
    billing: hasScope(request, scope.billing),
    editChargeVersions: isLicenceChargeInformationEditable && hasScope(request, scope.chargeVersionWorkflowEditor),
    reviewChargeVersions: isLicenceChargeInformationEditable && hasScope(request, scope.chargeVersionWorkflowReviewer),
    manageAgreements: isLicenceChargeInformationEditable && hasScope(request, scope.manageAgreements)
  };
};

const getLinks = ({ licenceId, documentId }, permissions) => ({
  returns: `/licences/${documentId}/returns`,
  bills: permissions.billing && `/licences/${licenceId}/bills`,
  setupCharge: permissions.editChargeVersions && `/licences/${licenceId}/charge-information/create`,
  makeNonChargeable: permissions.editChargeVersions && `/licences/${licenceId}/charge-information/non-chargeable-reason?start=1`,
  addAgreement: permissions.manageAgreements && `/licences/${licenceId}/agreements/select-type`
});

/**
 * Main licence summary page
 * All data is loaded via shared pre-handlers
 *
 * @param {String} request.params.licenceId - licence guid
 */
const getLicenceSummary = async (request, h) => {
  const { licenceId } = request.params;
  const { agreements, licence, returns, document, gaugingStations } = request.pre;
  const { data: gaugingStationsData } = gaugingStations;
  const documentId = getDocumentId(document);

  const permissions = getPermissions(request);

  const chargeVersions = mappers.mapChargeVersions(
    request.pre.chargeVersions,
    request.pre.chargeVersionWorkflows,
    {
      licenceId,
      ...permissions
    }
  );

  return h.view('nunjucks/view-licences/licence.njk', {
    ...request.view,
    pageTitle: `Licence ${licence.licenceNumber}`,
    featureToggles,
    licenceId,
    documentId,
    ...pick(request.pre, ['licence', 'bills', 'notifications', 'primaryUser', 'summary']),
    gaugingStationsData: uniqWith(gaugingStationsData, isEqual),
    chargeVersions,
    agreements: mappers.mapLicenceAgreements(agreements, { licenceId, ...permissions }),
    returns: {
      pagination: returns.pagination,
      data: returnsMapper.mapReturns(returns.data, request)
    },
    links: getLinks({ licenceId, documentId }, permissions),
    validityMessage: mappers.getValidityNotice(licence),
    back: '/licences'
  });
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
