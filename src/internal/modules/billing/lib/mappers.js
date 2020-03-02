const { omit, flatMap, mapValues } = require('lodash');
const groupArray = require('group-array');
const sentenceCase = require('sentence-case');
const helpers = require('@envage/water-abstraction-helpers');

/**
 * Creates a link to the batch specified if the batch
 * is in a suitable status
 * @param {Object} batch
 * @return {String}
 */
const mapBatchLink = batch =>
  ['processing', 'ready'].includes(batch.status)
    ? `/billing/batch/${batch.id}/summary`
    : null;

/**
 * Maps a batch for the batch list view, adding the badge, batch type and
 * bill count
 * @param {Object} batch
 * @return {Object}
 */
const mapBatchListRow = batch => ({
  ...batch,
  batchType: mapBatchType(batch.type),
  billCount: batch.externalId ? batch.totals.invoiceCount + batch.totals.creditNoteCount : null,
  link: mapBatchLink(batch)
});

const mapTransaction = transaction => omit(transaction, ['chargeElement']);

const mapChargeElementTransactions = group => {
  const transactions = group.map(row => row.transaction);
  const initialValue = {
    debits: 0,
    credits: 0,
    netTotal: 0
  };

  const totals = transactions.reduce((acc, row) => ({
    debits: acc.debits + (row.isCredit ? 0 : row.value),
    credits: acc.credits + (row.isCredit ? row.value : 0),
    netTotal: acc.netTotal + row.value
  }), initialValue);

  return {
    transactions: transactions.map(mapTransaction),
    totals,
    chargeElement: transactions[0].chargeElement
  };
};

const mapLicence = (chargeElements, licenceNumber) => {
  const arr = Object.values(chargeElements);
  return {
    link: arr[0][0].link,
    chargeElements: arr.map(mapChargeElementTransactions)
  };
};

const mapFinancialYear = (licences, financialYear) =>
  mapValues(licences, mapLicence);

/**
   *
   * @param {Object} invoice - payload from water service invoice detail call
   * @param {Map} documentIds - map of licence numbers / CRM document IDs
   */
const mapInvoiceTransactions = (invoice, documentIds) => {
  const transactions = flatMap(invoice.invoiceLicences.map(invoiceLicence => {
    const { licenceNumber } = invoiceLicence.licence;
    return invoiceLicence.transactions.map(transaction => ({
      transaction,
      financialYear: helpers.charging.getFinancialYear(transaction.chargePeriod.startDate),
      licenceNumber,
      link: `/licences/${documentIds.get(licenceNumber)}`
    }));
  }));

  // Group by financial year, licence number, charge element
  const grouped = groupArray(transactions, 'financialYear', 'licenceNumber', 'transaction.chargeElement.id');

  // Map the returned values
  return mapValues(grouped, mapFinancialYear);
};

const mapBatchType = (type) => type === 'two_part_tariff' ? 'Two-part tariff' : sentenceCase(type);

exports.mapBatchListRow = mapBatchListRow;
exports.mapInvoiceTransactions = mapInvoiceTransactions;
exports.mapBatchType = mapBatchType;
