'use strict';

const moment = require('moment');
const { sortBy } = require('lodash');
const agreementMapper = require('shared/lib/mappers/agreements');
const { getReturnPath } = require('../../../lib/return-path');

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

const mapChargeVersions = (chargeVersions, chargeVersionWorkflows) => {
  if (!chargeVersions) {
    return null;
  }
  return [
    ...chargeVersionWorkflows.data,
    ...sortBy(chargeVersions.data, ['dateRange.startDate', 'versionNumber']).reverse()
  ];
};

const mapLicenceAgreement = licenceAgreement => ({
  ...licenceAgreement,
  agreement: agreementMapper.mapAgreement(licenceAgreement.agreement)
});

const mapLicenceAgreements = licenceAgreements =>
  licenceAgreements && licenceAgreements.map(mapLicenceAgreement);

const mapReturns = (request, returns) => {
  if (!returns) {
    return null;
  }
  const { data, pagination } = returns;
  return {
    pagination,
    data: data.map(ret => ({
      ...ret,
      ...getReturnPath(ret, request)
    }))
  };
};

exports.getValidityNotice = getValidityNotice;
exports.mapChargeVersions = mapChargeVersions;
exports.mapLicenceAgreement = mapLicenceAgreement;
exports.mapLicenceAgreements = mapLicenceAgreements;
exports.mapReturns = mapReturns;
