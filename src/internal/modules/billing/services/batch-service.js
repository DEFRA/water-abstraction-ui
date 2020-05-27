'use strict';

const dataService = require('../../../lib/connectors/services');

const getBatch = (...args) => dataService.water.billingBatches.getBatch(...args);

/**
 * Gets the batch invoice and map the data for the
 * delete account from the batch UI
 * @param {*} batchId
 * @param {*} invoiceId
 */
const getBatchInvoice = async (batchId, invoiceId) => {
  const data = await dataService.water.billingBatches.getBatchInvoice(batchId, invoiceId);
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
