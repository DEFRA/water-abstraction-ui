'use strict';

const dataService = require('../../../lib/connectors/services');

const getBatch = (...args) => dataService.water.billingBatches.getBatch(...args);

/**
 * Gets the batch, and the invoices associated with the batch, then creates
 * a totals object that sums the data for all of the invoices found for the batch
 *
 * @param {String} batchId UUID of the batch
 */
const getBatchInvoices = async batchId => {
  const [batch, invoices] = await Promise.all([
    dataService.water.billingBatches.getBatch(batchId, true),
    dataService.water.billingBatches.getBatchInvoices(batchId)
  ]);

  return {
    batch,
    invoices
  };
};

/**
 * Gets the batch invoice and map the data for the
 * delete account from the batch UI
 * @param {*} batchId
 * @param {*} invoiceId
 */
const getBatchInvoice = async (batchId, invoiceId) => {
  const data = await dataService.water.billingBatches.getBatchInvoice(batchId, invoiceId);
  console.log(data);

  return {
    id: data.invoiceAccount.id,
    accountNumber: data.invoiceAccount.accountNumber,
    companyName: data.invoiceAccount.company.name,
    licences: data.invoiceLicences.map(invoiceLicence => ({ licenceRef: invoiceLicence.licence.licenceNumber })),
    amount: data.totals.netTotal,
    dateCreated: data.dateCreated
  };
};

const getBatchList = (page, perPage) => {
  return dataService.water.billingBatches.getBatches(page, perPage);
};

exports.getBatch = getBatch;
exports.getBatchList = getBatchList;
exports.getBatchInvoice = getBatchInvoice;
exports.getBatchInvoices = getBatchInvoices;
