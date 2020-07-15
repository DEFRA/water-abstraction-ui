const { groupBy } = require('lodash');
const routing = require('./routing');

/**
 * Map of two-part tariff status codes to human-readable error messages
 * @type {Map}
 */
const statusMessages = new Map();
statusMessages.set(10, 'No returns received');
statusMessages.set(20, 'Investigating query');
statusMessages.set(30, 'Returns received but not processed');
statusMessages.set(40, 'Some returns data outstanding');
statusMessages.set(50, 'Returns received late');
statusMessages.set(60, 'Over abstraction');
statusMessages.set(70, 'No returns available');

const getErrorString = errorCodes => errorCodes.reduce((acc, code) => {
  return acc ? 'Multiple errors' : statusMessages.get(code);
}, null);

const mapLicence = (batch, licence) => ({
  ...licence,
  twoPartTariffStatuses: getErrorString(licence.twoPartTariffStatuses),
  link: routing.getTwoPartTariffLicenceReviewRoute(batch, licence.billingInvoiceLicenceId)
});

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

/**
 * Creates a unique group string for the given transaction, based on the
 * purpose and abstraction period
 * @param {Object} transaction
 * @return {String} unique key
 */
const getTransactionGroup = transaction => {
  const { chargeElement } = transaction;
  const { startDay, startMonth, endDay, endMonth } = chargeElement.abstractionPeriod;
  return `${chargeElement.purposeUse.code}_${startDay}_${startMonth}_${endDay}_${endMonth}`;
};

const getTransactionError = transaction =>
  transaction.billingVolume.twoPartTariffError ? statusMessages.get(transaction.billingVolume.twoPartTariffStatus) : null;

/**
 * Decorates transactions with edit link and error message,
 * then groups them by purpose/abstraction period
 * @param {Object} batch
 * @param {Object} invoiceLicence
 * @return {Array} an array of transaction objects
 */
const getTransactionGroups = (batch, invoiceLicence) => {
  // Add 2PT error message
  const transactions = invoiceLicence.transactions.map(transaction => ({
    ...transaction,
    editLink: `/billing/batch/${batch.id}/two-part-tariff/licence/${invoiceLicence.id}/transaction/${transaction.id}`,
    error: getTransactionError(transaction)
  }));

  // Group by purpose use and abs period
  return Object.values(
    groupBy(transactions, getTransactionGroup)
  );
};

exports.getTotals = getTotals;
exports.mapLicence = mapLicence;
exports.getTransactionGroups = getTransactionGroups;
exports.getTransactionError = getTransactionError;
