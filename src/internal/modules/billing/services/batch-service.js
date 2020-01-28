'use strict';

const { add, mergeWith } = require('lodash');

const dataService = require('../../../lib/connectors/services');
const Batch = require('../lib/batch');
const Regions = require('../lib/regions');

const getBatch = async batchId => {
  const [batchResponse, regionResponse] = await Promise.all([
    dataService.water.billingBatches.getBatch(batchId),
    dataService.water.regions.getRegions()
  ]);

  const batch = batchResponse.data;
  const regions = regionResponse.data;

  const region = Regions.fromRegions(regions).getById(batch.regionId);

  const batchModel = new Batch(batchId, batch.dateCreated, batch.batchType);
  batchModel.setRegion(region.name, region.id);
  batchModel.status = batch.status;
  return batchModel;
};

/**
 * Adds the totals objects together for each of the passed invoices to
 * give a totals object for the whole batch.
 *
 * invoice.totals = {
 *   totalValue: 12,
 *   totalInvoices: 3,
 *   totalCredits: 9,
 *   numberOfInvoices: 2,
 *   numberOfCredits: 4
 * }
 *
 * @param {Array} invoices
 */
const calculateBatchTotals = invoices => {
  return invoices.reduce((totals, invoice) => {
    return mergeWith(invoice.totals, totals, add);
  }, {});
};

/**
 * Gets the batch, and the invoices associated with the batch, then creates
 * a totals object that sums the data for all of the invoices found for the batch
 *
 * @param {String} batchId UUID of the batch
 */
const getBatchInvoices = async batchId => {
  const [batch, { data: invoices }] = await Promise.all([
    getBatch(batchId),
    dataService.water.billingBatches.getBatchInvoices(batchId)
  ]);

  return {
    batch,
    invoices,
    totals: calculateBatchTotals(invoices)
  };
};

/**
 * Gets the batch invoice and map the data for the
 * delete account from the batch UI
 * @param {*} batchId
 * @param {*} invoiceId
 */
const getBatchInvoice = async (batchId, invoiceId) =>{
  const { data } = await dataService.water.billingBatches.getBatchInvoice(batchId, invoiceId);
  return {
    id: data.invoiceAccount.id,
    accountNumber: data.invoiceAccount.accountNumber,
    companyName: data.invoiceAccount.company.name,
    licences: data.invoiceLicences.map(invoiceLicence => ({ licenceRef: invoiceLicence.licence.licenceNumber })),
    amount: data.totals.totalValue,
    dateCreated: data.dateCreated
  };
};

const getBatchList = (page, perPage) => {
  return dataService.water.billingBatches.getBatches(page, perPage);
};

exports.getBatchList = getBatchList;
exports.getBatchInvoice = getBatchInvoice;
exports.getBatch = getBatch;
exports.getBatchInvoices = getBatchInvoices;
