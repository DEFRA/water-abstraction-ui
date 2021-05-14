'use strict';

const { get, pick, sortBy } = require('lodash');

const agreementMapper = require('shared/lib/mappers/agreements');
const mappers = require('../lib/mappers');
const { scope } = require('../../../lib/constants');
const { hasScope } = require('../../../lib/permissions');
const { featureToggles } = require('../../../config');

const sortChargeVersions = chargeVersions => {
  if (!chargeVersions) {
    return null;
  }
  return sortBy(chargeVersions, ['dateRange.startDate', 'versionNumber']).reverse();
};

const getLicenceSummary = async (request, h) => {
  const { licenceId } = request.params;

  const { agreements } = request.pre;

  const view = {
    ...request.view,
    featureToggles,
    licenceId,
    ...pick(request.pre, ['licence', 'bills', 'returns', 'notifications']),
    chargeVersions: sortChargeVersions(get(request, 'pre.chargeVersions.data')),
    agreements: agreements && agreements.map(agreementMapper.mapAgreement),
    links: {
      bills: `/licences/${licenceId}/bills`
    },
    isChargingUser: hasScope(request, scope.charging),
    validityMessage: mappers.getValidityNotice(request.pre.licence),
    back: '/licences'
  };

  return h.view('nunjucks/licences/licence.njk', view);
};

exports.getLicenceSummary = getLicenceSummary;
