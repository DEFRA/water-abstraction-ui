'use strict';

const routing = require('./routing');
const { groupBy } = require('lodash');
/**
 * Map of two-part tariff status codes to human-readable error messages
 * @type {Map}
 */
const statusMessages = new Map();
statusMessages.set(10, 'No returns received');
statusMessages.set(20, 'Checking query');
statusMessages.set(30, 'Returns received but not processed');
statusMessages.set(40, 'Some returns IDs not received');
statusMessages.set(50, 'Returns received late');
statusMessages.set(60, 'Over abstraction');
statusMessages.set(70, 'No returns received');
statusMessages.set(80, 'Too early to bill');
statusMessages.set(90, 'Overlap of charge dates');
statusMessages.set(100, 'No matching charge element');

const getErrorString = errorCodes => errorCodes.reduce((acc, code) => {
  return acc ? 'Multiple errors' : statusMessages.get(code);
}, null);

/**
 * Creates a unique group string for the given billing volume, based on the
 * purpose and abstraction period of its charge element
 * @param {Object} billingVolume
 * @return {String} unique key
 */
const getBillingVolumeGroup = billingVolume => {
  const { chargeElement } = billingVolume;
  const { startDay, startMonth, endDay, endMonth } = chargeElement.abstractionPeriod;
  return `${chargeElement.purposeUse.code}_${startDay}_${startMonth}_${endDay}_${endMonth}`;
};

const mapLicence = (batch, licenceGroup) => {
  const mappedLicence = licenceGroup.reduce((acc, licence) => {
    acc.licenceId = licence.licenceId;
    acc.licenceRef = licence.licenceRef;
    acc.billingContact = `${licence.billingContact}\n${acc.billingContact}`;
    acc.twoPartTariffError = acc.twoPartTariffError || licence.twoPartTariffError;
    acc.billingVolumeEdited = acc.billingVolumeEdited || licence.billingVolumeEdited;
    acc.twoPartTariffStatuses = [...acc.twoPartTariffStatuses, ...licence.twoPartTariffStatuses];
    acc.link = routing.getTwoPartTariffLicenceReviewRoute(batch, licence.licenceId, (licence.twoPartTariffError ? 'review' : 'view'));
    return acc;
  }, {
    licenceId: '',
    licenceRef: '',
    billingContact: '',
    twoPartTariffError: false,
    twoPartTariffStatuses: [],
    link: ''
  });

  mappedLicence.twoPartTariffStatuses = getErrorString(mappedLicence.twoPartTariffStatuses);
  return mappedLicence;
};

const getTotals = licences => {
  const errors = licences.reduce((acc, row) => (
    row.twoPartTariffError ? acc + 1 : acc
  ), 0);

  const totals = {
    errors,
    ready: licences.length - errors,
    total: licences.length
  };
  return totals;
};

const getBillingVolumeError = billingVolume =>
  statusMessages.get(billingVolume.twoPartTariffStatus);

/**
 * Decorates transactions with edit link and error message
 * @param {Object} batch
 * @param {Array} billingVolumes
 * @return {Array} an array of transaction objects
 */
const decorateBillingVolumes = (batch, licence, billingVolumes) => {
  // Add 2PT error message
  const arr = billingVolumes.map(billingVolume => ({
    ...billingVolume,
    editLink: `/billing/batch/${batch.id}/two-part-tariff/licence/${licence.id}/billing-volume/${billingVolume.id}`,
    error: getBillingVolumeError(billingVolume)
  }));
  // Group by purpose use and abs period
  return Object.values(
    groupBy(arr, getBillingVolumeGroup)
  );
};

exports.getTotals = getTotals;
exports.mapLicence = mapLicence;
exports.decorateBillingVolumes = decorateBillingVolumes;
exports.getBillingVolumeError = getBillingVolumeError;
