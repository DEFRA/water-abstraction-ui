'use strict';

const { pick } = require('lodash');

const mappers = require('../lib/mappers');
const { scope } = require('../../../lib/constants');
const { hasScope } = require('../../../lib/permissions');
const { featureToggles } = require('../../../config');

const getDocumentId = doc => doc.document_id;

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

  return h.view('nunjucks/licences/licence.njk', view);
};

exports.getLicenceSummary = getLicenceSummary;
