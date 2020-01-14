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
  return new Batch(batchId, batch.dateCreated, batch.batchType)
    .setRegion(region.name, region.id);
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

const getBatchList = (page, perPage) => {
  return dataService.water.billingBatches.getBatches(page, perPage);
};

exports.getBatchList = getBatchList;
exports.getBatch = getBatch;
exports.getBatchInvoices = getBatchInvoices;
