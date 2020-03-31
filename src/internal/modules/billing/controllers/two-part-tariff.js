const { groupBy } = require('lodash');
const services = require('internal/lib/connectors/services');

const messages = {
  10: 'No returns submitted',
  20: 'Under query',
  30: 'Received',
  40: 'Some returns are due',
  50: 'Late returns',
  60: 'Over abstraction'
};

const getTotals = licences => {
  const errors = licences.reduce((acc, row) => (
    acc + (row.twoPartTariffStatuses.length > 0 ? 1 : 0)
  ), 0);

  const totals = {
    errors,
    ready: licences.length - errors,
    total: licences.length
  };
  return totals;
};

const getErrorString = errorCodes => errorCodes.reduce((acc, code) => {
  return acc ? 'Multiple errors' : messages[code];
}, null);

const getTwoPartTariffAction = async (request, h, action) => {
  const { batch } = request.pre;
  const licencesData = await services.water.billingBatches.getBatchLicences(batch.id);
  // gets 2pt matching error messages and define error types
  const licences = licencesData.map(licence => ({
    ...licence,
    twoPartTariffStatuses: getErrorString(licence.twoPartTariffStatuses)
  }));

  return h.view('nunjucks/billing/two-part-tariff-' + action, {
    ...request.view,
    batch,
    licences,
    totals: getTotals(licencesData),
    back: `/billing/batch/list`
  });
};

const getTwoPartTariffReview = async (request, h) => getTwoPartTariffAction(request, h, 'review');
const getTwoPartTariffViewReady = async (request, h) => getTwoPartTariffAction(request, h, 'ready');

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
    editLink: `/billing/batch/${batch.id}/two-part-tariff-licence-review/${invoiceLicence.id}/transaction/${transaction.id}`,
    error: messages[transaction.twoPartTariffError]
  }));

  // Group by purpose use and abs period
  return Object.values(
    groupBy(transactions, getTransactionGroup)
  );
};

/**
 * Allows user to view issues with a single invoice licence
 */
const getLicenceReview = async (request, h) => {
  const { batch } = request.pre;
  const { invoiceLicenceId } = request.params;

  const invoiceLicence = await services.water.billingInvoiceLicences.getInvoiceLicence(invoiceLicenceId);

  return h.view('nunjucks/billing/two-part-tariff-licence-review', {
    pageTitle: `Review returns data issues for ${invoiceLicence.licence.licenceNumber}`,
    ...request.view,
    batch,
    transactionGroups: getTransactionGroups(batch, invoiceLicence),
    back: `/billing/batch/${batch.id}/two-part-tariff-review`,
    removeLink: `/billing/batch/${batch.id}/two-part-tariff-remove-licence/${invoiceLicence.id}`
  });
};

exports.getTwoPartTariffReview = getTwoPartTariffReview;
exports.getTwoPartTariffViewReady = getTwoPartTariffViewReady;
exports.getLicenceReview = getLicenceReview;
