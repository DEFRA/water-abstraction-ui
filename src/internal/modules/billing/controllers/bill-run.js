'use strict';

const titleCase = require('title-case');
const { pluralize } = require('shared/lib/pluralize');
const moment = require('moment');
const Boom = require('@hapi/boom');
const { get } = require('lodash');

const { cancelOrConfirmBatchForm } = require('../forms/cancel-or-confirm-batch');
const services = require('internal/lib/connectors/services');
const batchService = require('../services/batch-service');
const transactionsCSV = require('../services/transactions-csv');
const csv = require('internal/lib/csv-download');
const { logger } = require('internal/logger');
const mappers = require('../lib/mappers');
const { featureToggles } = require('../../../config');

const confirmForm = require('shared/lib/forms/confirm-form');

const getBillRunPageTitle = batch => `${mappers.mapBatchType(batch.type)} bill run`;

/**
 * Shows a batch with its list of invoices
 * together with their totals
 * @param {String} request.params.batchId
 */
const getBillingBatchSummary = async (request, h) => {
  const { batch } = request.pre;
  const invoices = await services.water.billingBatches.getBatchInvoices(batch.id);

  return h.view('nunjucks/billing/batch-summary', {
    ...request.view,
    pageTitle: getBillRunPageTitle(batch),
    subHeading: `${invoices.length} ${mappers.mapBatchType(batch.type).toLowerCase()} ${pluralize('bill', invoices)}`,
    batch,
    invoices: mappers.mapInvoices(batch, invoices),
    isAnnual: batch.type === 'annual',
    isEditable: batch.status === 'ready',
    errors: mappers.mapBatchLevelErrors(batch, invoices),
    // only show the back link from the list page, so not to offer the link
    // as part of the batch creation flow.
    back: request.query.back && '/billing/batch/list'
  });
};

const getBillingBatchInvoice = async (request, h) => {
  const { batchId, invoiceId } = request.params;

  const [ batch, invoice ] = await Promise.all([
    services.water.billingBatches.getBatch(batchId),
    services.water.billingBatches.getBatchInvoice(batchId, invoiceId)
  ]);

  const licenceNumbers = invoice.invoiceLicences.map(invoiceLicence => invoiceLicence.licence.licenceNumber);
  const documentIds = await services.crm.documents.getDocumentIdMap(licenceNumbers);

  return h.view('nunjucks/billing/batch-invoice', {
    ...request.view,
    back: `/billing/batch/${batchId}/summary`,
    pageTitle: `Bill for ${titleCase(invoice.invoiceAccount.company.name)}`,
    invoice,
    financialYearEnding: invoice.financialYear.yearEnding,
    batch,
    batchType: mappers.mapBatchType(batch.type),
    invoiceLicences: mappers.mapInvoiceLicences(invoice, documentIds),
    isCredit: get(invoice, 'totals.netTotal', 0) < 0,
    caption: `Billing account ${invoice.invoiceAccount.accountNumber}`,
    errors: mappers.mapInvoiceLevelErrors(invoice)
  });
};

const getBillingBatchList = async (request, h) => {
  const { page } = request.query;
  const { data, pagination } = await batchService.getBatchList(page, 10);

  return h.view('nunjucks/billing/batch-list', {
    ...request.view,
    batches: data.map(mappers.mapBatchListRow),
    pagination,
    form: featureToggles.deleteAllBillingData && confirmForm.form(request, 'Delete all bills and charge information', {
      action: '/billing/batch/delete-all-data',
      isWarning: true
    })
  });
};

const billingBatchAction = (request, h, action) => {
  const { batch } = request.pre;
  const titleAction = (action === 'confirm') ? 'send' : 'cancel';
  return h.view('nunjucks/billing/confirm-page-with-metadata', {
    ...request.view,
    batch,
    pageTitle: `You are about to ${titleAction} this bill run`,
    secondTitle: getBillRunPageTitle(batch),
    metadataType: 'batch',
    form: cancelOrConfirmBatchForm(request, action),
    back: `/billing/batch/${batch.id}/summary`
  });
};

const getBillingBatchCancel = async (request, h) => billingBatchAction(request, h, 'cancel');

const postBillingBatchCancel = async (request, h) => {
  const { batchId } = request.params;
  try {
    await services.water.billingBatches.cancelBatch(batchId);
  } catch (err) {
    logger.info(`Did not successfully delete batch ${batchId}`);
  }
  return h.redirect('/billing/batch/list');
};

const getBillingBatchConfirm = async (request, h) => billingBatchAction(request, h, 'confirm');

const postBillingBatchConfirm = async (request, h) => {
  const { batchId } = request.params;
  await services.water.billingBatches.approveBatch(batchId);
  return h.redirect(`/billing/batch/${batchId}/summary`);
};

/**
 * allows user to download all the invoices, transactions, company,
 * licence and agreements data for a batch
 * @param {*} request
 * @param {*} h
 */
const getTransactionsCSV = async (request, h) => {
  const { batchId } = request.params;
  const data = await services.water.billingBatches.getBatchInvoicesDetails(batchId);
  const csvData = await transactionsCSV.createCSV(data);
  const fileName = transactionsCSV.getCSVFileName(request.pre.batch);
  return csv.csvDownload(h, csvData, fileName);
};

/**
 * Remove an invoice from the bill run
 * @param {*} request
 * @param {*} h
 */
const getBillingBatchDeleteInvoice = async (request, h) => {
  const { batchId } = request.params;
  const { batch, invoice } = request.pre;

  const batchType = mappers.mapBatchType(batch.type).toLowerCase();

  return h.view('nunjucks/billing/confirm-page-with-metadata', {
    ...request.view,
    pageTitle: `You're about to remove this bill from the ${batchType} bill run`,
    batch,
    invoice,
    form: confirmForm.form(request, 'Remove bill'),
    metadataType: 'invoice',
    back: `/billing/batch/${batchId}/summary`
  });
};

const postBillingBatchDeleteInvoice = async (request, h) => {
  const { batchId, invoiceId } = request.params;
  await services.water.billingBatches.deleteInvoiceFromBatch(batchId, invoiceId);
  return h.redirect(`/billing/batch/${batchId}/summary`);
};

/**
 * Renders a 'waiting' page while the batch is processing.
 * If the batch is in error, responds with a 500 error page.
 * The redirectOnBatchStatus pre handler will have already redirected to the appropriate page
 * if the batch is processed.
 * @param {Object} request.pre.batch - billing batch loaded by pre handler
 * @param {Number} request.query.back - whether to render back button
 */
const getBillingBatchProcessing = async (request, h) => {
  const { batch } = request.pre;
  const back = !!request.query.back;

  // Render error page if batch has errored
  if (batch.status === 'error') {
    return Boom.badImplementation('Billing batch error');
  }

  return h.view('nunjucks/billing/batch-processing', {
    ...request.view,
    caption: moment(batch.createdAt).format('D MMMM YYYY'),
    pageTitle: `${batch.region.displayName} ${mappers.mapBatchType(batch.type).toLowerCase()} bill run`,
    back: back && `/billing/batch/list`
  });
};

/**
 * Renders an error page if the batch is empty - i.e. no transactions
 * @param {Object} request.pre.batch - billing batch loaded by pre handler
 */
const getBillingBatchEmpty = async (request, h) => {
  const { batch } = request.pre;

  return h.view('nunjucks/billing/batch-empty', {
    ...request.view,
    pageTitle: getBillRunPageTitle(batch),
    batch,
    back: `/billing/batch/list`
  });
};

/**
 * Deletes all billing data
 */
const postDeleteAllBillingData = async (request, h) => {
  await services.water.billingBatches.deleteAllBillingData();
  return h.redirect('/billing/batch/list');
};

exports.getBillingBatchList = getBillingBatchList;
exports.getBillingBatchSummary = getBillingBatchSummary;
exports.getBillingBatchInvoice = getBillingBatchInvoice;

exports.getBillingBatchCancel = getBillingBatchCancel;
exports.postBillingBatchCancel = postBillingBatchCancel;

exports.getBillingBatchConfirm = getBillingBatchConfirm;
exports.postBillingBatchConfirm = postBillingBatchConfirm;

exports.getBillingBatchDeleteInvoice = getBillingBatchDeleteInvoice;
exports.postBillingBatchDeleteInvoice = postBillingBatchDeleteInvoice;

exports.getTransactionsCSV = getTransactionsCSV;

exports.getBillingBatchProcessing = getBillingBatchProcessing;
exports.getBillingBatchEmpty = getBillingBatchEmpty;

exports.postDeleteAllBillingData = postDeleteAllBillingData;
