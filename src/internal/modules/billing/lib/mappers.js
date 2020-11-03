'use strict';

const { omit, sortBy, groupBy } = require('lodash');
const sentenceCase = require('sentence-case');
const routing = require('./routing');
const { transactionStatuses } = require('shared/lib/constants');

/**
 * Maps a batch for the batch list view, adding the badge, batch type and
 * bill count
 * @param {Object} batch
 * @return {Object}
 */
const mapBatchListRow = batch => ({
  ...batch,
  batchType: mapBatchType(batch.type),
  billCount: batch.totals ? batch.totals.invoiceCount + batch.totals.creditNoteCount : null,
  link: routing.getBillingBatchRoute(batch)
});

const isTransactionEdited = transaction => {
  if (!transaction.billingVolume) return false;
  return transaction.billingVolume.calculatedVolume !== transaction.billingVolume.volume;
};

const mapTransaction = transaction => ({
  ...omit(transaction, ['chargeElement']),
  isEdited: isTransactionEdited(transaction)
});

const isTransactionInErrorStatus = transaction => transaction.status === transactionStatuses.error;

const getTransactionTotals = transactions => {
  const hasErrors = transactions.some(isTransactionInErrorStatus);
  if (hasErrors) {
    return null;
  }

  const initialValue = {
    debits: 0,
    credits: 0,
    netTotal: 0
  };

  return transactions.reduce((acc, row) => ({
    debits: acc.debits + (row.isCredit ? 0 : row.value),
    credits: acc.credits + (row.isCredit ? row.value : 0),
    netTotal: acc.netTotal + row.value
  }), initialValue);
};

const isMinimimChargeTransaction = trans => trans.isMinimumCharge;
const isNotMinimumChargeTransaction = trans => !isMinimimChargeTransaction(trans);

const mapTransactionGroup = transactions => ({
  chargeElement: transactions[0].chargeElement,
  transactions: transactions.map(mapTransaction),
  totals: getTransactionTotals(transactions)
});

const getTransactionGroups = transactions => {
  const arr = transactions.filter(isNotMinimumChargeTransaction);
  const grouped = groupBy(arr, trans => trans.chargeElement.id);
  return Object.values(grouped).map(mapTransactionGroup);
};

/**
   *
   * @param {Object} invoice - payload from water service invoice detail call
   * @param {Map} documentIds - map of licence numbers / CRM document IDs
   */
const mapInvoiceLicences = (invoice, documentIds) =>
  invoice.invoiceLicences.map(invoiceLicence => {
    const { licenceNumber } = invoiceLicence.licence;
    const { id, hasTransactionErrors, transactions } = invoiceLicence;

    return {
      id,
      licenceNumber,
      hasTransactionErrors,
      link: `/licences/${documentIds.get(licenceNumber)}`,
      minimumChargeTransactions: transactions.filter(isMinimimChargeTransaction),
      transactionGroups: getTransactionGroups(transactions)
    };
  });

const mapBatchType = (type) => type === 'two_part_tariff' ? 'Two-part tariff' : sentenceCase(type);

const mapCondition = (conditionType, condition) => ({
  title: sentenceCase(conditionType.displayTitle.replace('Aggregate condition', '')),
  parameter1Label: conditionType.parameter1Label.replace('licence number', 'licence'),
  parameter1: condition.parameter1,
  parameter2Label: conditionType.parameter2Label,
  parameter2: condition.parameter2,
  text: condition.text
});

/**
 * Maps an array of conditions retrieved from licence summary water service call
 * to the shape necessary for display on the two part tariff transaction review screen
 * @param {Array} nested conditions
 * @return {Array} flat list ready for view
 */
const mapConditions = conditions => conditions.reduce((acc, conditionType) => {
  conditionType.points.forEach(point => {
    point.conditions.forEach(condition => {
      acc.push(mapCondition(conditionType, condition));
    });
  });
  return acc;
}, []);

const mapInvoice = invoice => ({
  ...invoice,
  isCredit: invoice.netTotal < 0,
  group: invoice.isWaterUndertaker ? 'waterUndertakers' : 'otherAbstractors',
  sortValue: -Math.abs(invoice.netTotal)
});

const mapInvoices = (batch, invoices) => {
  const mappedInvoices = sortBy(invoices.map(mapInvoice), 'sortValue');
  return batch.type === 'annual' ? groupBy(mappedInvoices, 'group') : mappedInvoices;
};

const mapInvoiceLevelErrors = invoice => invoice.invoiceLicences
  .filter(invoiceLicence => invoiceLicence.hasTransactionErrors)
  .map(invoiceLicence => ({
    id: invoiceLicence.id,
    message: `There are problems with transactions on licence ${invoiceLicence.licence.licenceNumber}`
  }));

exports.mapBatchListRow = mapBatchListRow;
exports.mapInvoiceLicences = mapInvoiceLicences;
exports.mapBatchType = mapBatchType;
exports.mapConditions = mapConditions;
exports.mapInvoices = mapInvoices;
exports.mapInvoiceLevelErrors = mapInvoiceLevelErrors;
