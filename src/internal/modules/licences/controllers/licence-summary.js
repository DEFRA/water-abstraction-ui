'use strict';

const { pick } = require('lodash');

const mappers = require('../lib/mappers');
const { scope } = require('../../../lib/constants');
const { hasScope } = require('../../../lib/permissions');
const { featureToggles } = require('../../../config');

const getLicenceSummary = async (request, h) => {
  const { licenceId } = request.params;
  const { agreements, chargeVersions, chargeVersionWorkflows, licence } = request.pre;

  const view = {
    ...request.view,
    pageTitle: `Licence ${licence.licenceNumber}`,
    featureToggles,
    licenceId,
    ...pick(request.pre, ['licence', 'bills', 'returns', 'notifications']),
    chargeVersions: mappers.mapChargeVersions(chargeVersions, chargeVersionWorkflows),
    agreements: mappers.mapLicenceAgreements(agreements),
    links: {
      bills: `/licences/${licenceId}/bills`
    },
    isChargingUser: hasScope(request, scope.charging),
    validityMessage: mappers.getValidityNotice(licence),
    back: '/licences'
  };

  console.log(view);

  return h.view('nunjucks/licences/licence.njk', view);
};

exports.getLicenceSummary = getLicenceSummary;
