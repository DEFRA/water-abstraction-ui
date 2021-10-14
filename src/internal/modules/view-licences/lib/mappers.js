'use strict';

const moment = require('moment');
const { sortBy, get, isNull } = require('lodash');
const agreementMapper = require('shared/lib/mappers/agreements');
const config = require('../../../config');

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
    getLink('View', `/licences/${licenceId}/charge-information/${chargeVersion.id}/view`)
  ]
});

const getLink = (text, path) => ({ text, path });

const getChargeVersionWorkflowLinks = (chargeVersionWorkflow, options) => {
  const { licenceId, editChargeVersions, reviewChargeVersions } = options;
  if (chargeVersionWorkflow.status === 'to_setup' && editChargeVersions) {
    return [
      getLink('Set up', `/licences/${licenceId}/charge-information/create?chargeVersionWorkflowId=${chargeVersionWorkflow.id}`),
      getLink('Remove', `/charge-information-workflow/${chargeVersionWorkflow.id}/remove`)
    ];
  } else if (reviewChargeVersions) {
    return [
      getLink('Review', `/licences/${licenceId}/charge-information/${chargeVersionWorkflow.id}/review`)
    ];
  }
  return [];
};

const mapChargeVersionWorkflow = (chargeVersionWorkflow, options) => ({
  ...get(chargeVersionWorkflow, 'chargeVersion', {}),
  status: chargeVersionWorkflow.status,
  id: chargeVersionWorkflow.id,
  links: getChargeVersionWorkflowLinks(chargeVersionWorkflow, options)
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

const getLicenceAgreementLinks = (licenceAgreement, options) => {
  const hasNotEnded = isNull(licenceAgreement.dateRange.endDate);
  const is2PTAgreement = get(licenceAgreement, 'agreement.code') === 'S127';
  const isNotMarkedForSupplementaryBilling = options.includeInSupplementaryBilling === 'no';

  if (!options.manageAgreements) {
    return [];
  }
  const deleteLink = getLink('Delete', `/licences/${options.licenceId}/agreements/${licenceAgreement.id}/delete`);
  const endLink = getLink('End', `/licences/${options.licenceId}/agreements/${licenceAgreement.id}/end`);
  const recalculateLink = getLink('Recalculate bills', `/licences/${options.licenceId}/mark-for-supplementary-billing`);

  const compiledLinks = hasNotEnded
    ? [deleteLink, endLink]
    : [deleteLink];

  if (hasNotEnded && is2PTAgreement && isNotMarkedForSupplementaryBilling && config.featureToggles.recalculateBills) {
    compiledLinks.push(recalculateLink);
  }

  return compiledLinks;
};

const mapLicenceAgreement = (licenceAgreement, options) => ({
  ...licenceAgreement,
  agreement: agreementMapper.mapAgreement(licenceAgreement.agreement),
  links: getLicenceAgreementLinks(licenceAgreement, options)
});

const mapLicenceAgreements = (licenceAgreements, options) =>
  licenceAgreements && licenceAgreements.map(licenceAgreement => mapLicenceAgreement(licenceAgreement, options));

exports.getValidityNotice = getValidityNotice;
exports.mapChargeVersions = mapChargeVersions;
exports.mapLicenceAgreement = mapLicenceAgreement;
exports.mapLicenceAgreements = mapLicenceAgreements;
