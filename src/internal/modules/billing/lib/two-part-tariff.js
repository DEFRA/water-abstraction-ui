'use strict';

const routing = require('./routing');
const { groupBy, get, sortedUniq } = require('lodash');
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
  const dedupLicences = licences.filter((item, ind, arr) => arr.findIndex(temp => (temp.licenceId === item.licenceId)) === ind);
  const errors = dedupLicences.reduce((acc, row) => (
    row.twoPartTariffError ? acc + 1 : acc
  ), 0);

  const totals = {
    errors,
    ready: dedupLicences.length - errors,
    total: dedupLicences.length
  };
  return totals;
};

const getBillingVolumeError = billingVolume =>
  statusMessages.get(billingVolume.twoPartTariffStatus);

/**
 * Decorates transactions with edit link and error message
 * @param {Object} batch
 * @param licence
 * @param {Array} billingVolumes
 * @return {Array} an array of transaction objects
 */
const decorateBillingVolumes = (batch, licence, billingVolumes) => {
  let billingVolumesWithLinks = {};
  for (const [key, value] of Object.entries(billingVolumes)) {
    const arr = value.map(value => ({
      ...value,
      editLink: `/billing/batch/${batch.id}/two-part-tariff/licence/${licence.id}/billing-volume/${value.id}`,
      error: getBillingVolumeError(value)
      // totals: getTotals(value)
    }));
    billingVolumesWithLinks[key] = Object.values(groupBy(arr, getBillingVolumeGroup));
  }

  return Object.entries(billingVolumesWithLinks).reverse();
};

/**
 * Returns an array of billing account numbers.
 * @param {Array} billingVolumesValue
 * @return {Array} an array of transaction objects
 */

const filterInvoiceAccountNumber = (billingVolumesValue) => {
  let accountNumber = [];
  Object.entries(billingVolumesValue).forEach(value => {
    return get(value, 'invoiceAccount.accountNumber');
  });

  return accountNumber;
};

/**
 * Returns an array of unique billing account numbers within year ending.
 * @param {Array} billingVolumes
 * @param {String} financialYearEnding
 * @return {Array} an array of transaction objects
 */

const decorateBillingVolumesAccount = (billingVolumes, financialYearEnding) => {
  let foundAccountNumber = [];
  for (const [billingVolumesValuesKey, billingVolumesValue] of Object.entries(billingVolumes)) {
    if (billingVolumesValuesKey === financialYearEnding) {
      foundAccountNumber.push(filterInvoiceAccountNumber(billingVolumesValue));
    }
  }
  return sortedUniq(foundAccountNumber);
};

exports.getTotals = getTotals;
exports.mapLicence = mapLicence;
exports.decorateBillingVolumes = decorateBillingVolumes;
exports.getBillingVolumeError = getBillingVolumeError;
exports.decorateBillingVolumesAccount = decorateBillingVolumesAccount;
