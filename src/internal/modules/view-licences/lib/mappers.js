'use strict';

const moment = require('moment');
const { sortBy, get } = require('lodash');
const agreementMapper = require('shared/lib/mappers/agreements');

const validityMessageMap = new Map()
  .set('expiredDate', 'expired on')
  .set('lapsedDate', 'lapsed on')
  .set('revokedDate', 'was revoked on');

const formatDate = date => moment(date).format('D MMMM YYYY');

/**
 * Gets a message if the licence is future-dated / ended
 * @param {Object} licence
 * @param {String} [refDate]
 * @returns {String}
 */
const getValidityNotice = (licence, refDate) => {
  const { isFutureDated, startDate, endDate, endDateReason } = licence;
  if (isFutureDated) {
    return `This licence starts on ${formatDate(startDate)}`;
  }
  if (moment(refDate).isAfter(endDate, 'day')) {
    return `This licence ${validityMessageMap.get(endDateReason)} ${formatDate(endDate)}`;
  }
  return null;
};

const mapChargeVersion = (chargeVersion, { licenceId }) => ({
  ...chargeVersion,
  links: [
    createLink('View', `/licences/${licenceId}/charge-information/${chargeVersion.id}/view`)
  ]
});

const createLink = (text, path) => ({ text, path });

const createChargeVersionWorkflowLinks = (chargeVersionWorkflow, options) => {
  const { licenceId, editChargeVersions, reviewChargeVersions } = options;
  if (chargeVersionWorkflow.status === 'to_setup' && editChargeVersions) {
    return [
      createLink('Set up', `/licences/${licenceId}/charge-information/create?chargeVersionWorkflowId=${chargeVersionWorkflow.id}`),
      createLink('Remove', `/charge-information-workflow/${chargeVersionWorkflow.id}/remove`)
    ];
  } else if (reviewChargeVersions) {
    return [
      createLink('Review', `/licences/${licenceId}/charge-information/${chargeVersionWorkflow.id}/review`)
    ];
  }
  return [];
};

const mapChargeVersionWorkflow = (chargeVersionWorkflow, options) => ({
  ...get(chargeVersionWorkflow, 'chargeVersion', {}),
  status: chargeVersionWorkflow.status,
  id: chargeVersionWorkflow.id,
  links: createChargeVersionWorkflowLinks(chargeVersionWorkflow, options)
});

const mapChargeVersions = (chargeVersions, chargeVersionWorkflows, options) => {
  if (!chargeVersions) {
    return null;
  }
  const sortedChargeVersions = sortBy(chargeVersions.data, ['dateRange.startDate', 'versionNumber'])
    .reverse();
  return [
    ...chargeVersionWorkflows.data.map(chargeVersionWorflow => mapChargeVersionWorkflow(chargeVersionWorflow, options)),
    ...sortedChargeVersions.map(chargeVersion => mapChargeVersion(chargeVersion, options))
  ];
};

const mapLicenceAgreement = licenceAgreement => ({
  ...licenceAgreement,
  agreement: agreementMapper.mapAgreement(licenceAgreement.agreement)
});

const mapLicenceAgreements = licenceAgreements =>
  licenceAgreements && licenceAgreements.map(mapLicenceAgreement);

exports.getValidityNotice = getValidityNotice;
exports.mapChargeVersions = mapChargeVersions;
exports.mapLicenceAgreement = mapLicenceAgreement;
exports.mapLicenceAgreements = mapLicenceAgreements;
