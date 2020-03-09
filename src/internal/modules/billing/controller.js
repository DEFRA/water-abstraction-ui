'use strict';

const uuid = require('uuid/v4');
const { selectBillingTypeForm, billingTypeFormSchema } = require('./forms/billing-type');
const { selectBillingRegionForm, billingRegionFormSchema } = require('./forms/billing-region');
const { deleteAccountFromBatchForm } = require('./forms/billing-batch-delete-account');
const services = require('internal/lib/connectors/services');
const forms = require('shared/lib/forms');
const { get } = require('lodash');
const queryString = require('querystring');
const helpers = require('@envage/water-abstraction-helpers');
const batchService = require('./services/batch-service');
const transactionsCSV = require('./services/transactions-csv');
const csv = require('internal/lib/csv-download');
const { logger } = require('internal/logger');
const mappers = require('./lib/mappers');

const getSessionForm = (request) => {
  return request.yar.get(get(request, 'query.form'));
};

const clearSessionForm = (request) => {
  request.yar.clear(get(request, 'query.form'));
};

/**
 * Step 1a of create billing batch flow - display form to select type
 * i.e. Annual, Supplementary, Two-Part Tariff
 * @param {*} request
 * @param {*} h
 */
const getBillingBatchType = async (request, h) => {
  const sessionForm = getSessionForm(request);
  if (sessionForm) { clearSessionForm(request); }

  return h.view('nunjucks/form', {
    ...request.view,
    back: '/manage',
    form: sessionForm || selectBillingTypeForm(request)
  });
};

const getBillingRegions = async () => {
  const { data } = await services.water.regions.getRegions();
  return data;
};

/**
 * Step 1b - receive posted step 1a data
 * @param {*} request
 * @param {*} h
 */
const postBillingBatchType = async (request, h) => {
  const billingTypeForm = forms.handleRequest(selectBillingTypeForm(request), request, billingTypeFormSchema(request));

  if (billingTypeForm.isValid) {
    const { selectedBillingType } = forms.getValues(billingTypeForm);
    return h.redirect(`/billing/batch/region/${selectedBillingType}`);
  }

  const key = uuid();
  request.yar.set(key, billingTypeForm);
  return h.redirect('/billing/batch/type?' + queryString.stringify({ form: key }));
};

/**
 * Step 2a - display selelct region form
 * @param {*} request
 * @param {*} h
 */
const getBillingBatchRegion = async (request, h) => {
  const sessionForm = getSessionForm(request);
  if (sessionForm) { clearSessionForm(request); }

  const regions = await getBillingRegions();

  return h.view('nunjucks/form', {
    ...request.view,
    back: '/billing/batch/type',
    form: sessionForm || selectBillingRegionForm(request, regions)
  });
};

const getBatchDetails = (request, billingRegionForm) => {
  const { selectedBillingType, selectedBillingRegion } = forms.getValues(billingRegionForm);
  const financialYear = (new Date().getMonth > 3) ? helpers.charging.getFinancialYear() + 1 : helpers.charging.getFinancialYear();
  const batch = {
    userEmail: request.defra.user.user_name,
    regionId: selectedBillingRegion,
    batchType: selectedBillingType,
    financialYearEnding: financialYear,
    season: 'all year' // ('summer', 'winter', 'all year').required();
  };
  return batch;
};

/**
 * Step 2b received step 2a posted data
 * try to create a new billing run batch
 * redirect to waiting page
 * @param {*} request
 * @param {*} h
 */
const postBillingBatchRegion = async (request, h) => {
  const regions = await getBillingRegions();
  const billingRegionForm = forms.handleRequest(selectBillingRegionForm(request, regions), request, billingRegionFormSchema);

  if (!billingRegionForm.isValid) {
    const { selectedBillingType } = forms.getValues(billingRegionForm);
    const key = uuid();
    request.yar.set(key, billingRegionForm);
    return h.redirect(`/billing/batch/region/${selectedBillingType}?` + queryString.stringify({ form: key }));
  }

  try {
    const batch = getBatchDetails(request, billingRegionForm);
    const { data: { event } } = await services.water.billingBatches.createBillingBatch(batch);
    return h.redirect(`/waiting/${event.eventId}?back=0`);
  } catch (err) {
    if (err.statusCode === 409) {
      return h.redirect(`/billing/batch/${err.error.existingBatch.id}/exists`);
    }
    throw err;
  }
};

/**
 * If the Bill run for the type and region exists then display a basic summary page
 * @param {*} request
 * @param {*} h
 */
const getBillingBatchExists = async (request, h) => {
  return h.view('nunjucks/billing/batch-exist', {
    ...request.view,
    today: new Date(),
    back: '/billing/batch/region',
    batch: request.pre.batch
  });
};

/**
 * Shows a batch with its list of invoices
 * together with their totals
 * @param {String} request.params.batchId
 */
const getBillingBatchSummary = async (request, h) => {
  const { batchId } = request.params;
  const { error } = request.query;
  const { batch, invoices } = await batchService.getBatchInvoices(batchId);

  return h.view('nunjucks/billing/batch-summary', {
    ...request.view,
    pageTitle: `${batch.region.name} ${batch.type.replace(/_/g, ' ')} bill run`,
    batch,
    invoices: invoices.map(row => ({
      ...row,
      isCredit: row.netTotal < 0
    })),
    // This error string comes from the query param, and will allow us
    // to display a suitable alert to the user e.g. when a batch cannot
    // be approved
    error,
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
    pageTitle: 'January 2020 invoice',
    invoice,
    batch,
    batchType: mappers.mapBatchType(batch.type),
    transactions: mappers.mapInvoiceTransactions(invoice, documentIds),
    isCredit: invoice.totals.netTotal < 0
  });
};

const getBillingBatchList = async (request, h) => {
  const { page } = request.query;
  const { data, pagination } = await batchService.getBatchList(page, 10);

  return h.view('nunjucks/billing/batch-list', {
    ...request.view,
    batches: data.map(mappers.mapBatchListRow),
    pagination
  });
};

const getBillingBatchCancel = async (request, h) => {
  const { batch } = request.pre;
  return h.view('nunjucks/billing/batch-cancel', {
    ...request.view,
    batch,
    back: `/billing/batch/${batch.id}/summary`
  });
};

const postBillingBatchCancel = async (request, h) => {
  const { batchId } = request.params;
  try {
    await services.water.billingBatches.cancelBatch(batchId);
  } catch (err) {
    logger.info(`Did not successfully delete batch ${batchId}`);
  }
  return h.redirect('/billing/batch/list');
};

const getBillingBatchConfirm = async (request, h) => {
  const { batch } = request.pre;
  return h.view('nunjucks/billing/batch-confirm', {
    ...request.view,
    batch,
    back: `/billing/batch/${batch.id}/summary`
  });
};

const postBillingBatchConfirm = async (request, h) => {
  const { batchId } = request.params;
  const redirectPath = `/billing/batch/${batchId}/summary`;
  try {
    await services.water.billingBatches.approveBatch(batchId);
  } catch (err) {
    logger.info(`Did not successfully approve batch ${batchId}`);
    return h.redirect(`${redirectPath}?error=confirm`);
  }
  return h.redirect(redirectPath);
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
const getBillingBatchDeleteAccount = async (request, h) => {
  const { batchId, invoiceId } = request.params;
  const account = await batchService.getBatchInvoice(batchId, invoiceId);
  return h.view('nunjucks/billing/batch-delete-account', {
    ...request.view,
    pageTitle: 'You are about to remove this invoice from the bill run',
    account,
    form: deleteAccountFromBatchForm(request, account.id),
    batch: { id: batchId },
    back: `/billing/batch/${batchId}/summary`
  });
};

const postBillingBatchDeleteAccount = async (request, h) => {
  const { accountId, batchId } = request.params;
  await services.water.billingBatches.deleteAccountFromBatch(batchId, accountId);
  return h.redirect(`/billing/batch/${batchId}/summary`);
};

exports.getBillingBatchList = getBillingBatchList;
exports.getBillingBatchSummary = getBillingBatchSummary;
exports.getBillingBatchExists = getBillingBatchExists;
exports.getBillingBatchInvoice = getBillingBatchInvoice;

exports.getBillingBatchType = getBillingBatchType;
exports.postBillingBatchType = postBillingBatchType;

exports.getBillingBatchRegion = getBillingBatchRegion;
exports.postBillingBatchRegion = postBillingBatchRegion;

exports.getBillingBatchCancel = getBillingBatchCancel;
exports.postBillingBatchCancel = postBillingBatchCancel;

exports.getBillingBatchConfirm = getBillingBatchConfirm;
exports.postBillingBatchConfirm = postBillingBatchConfirm;

exports.getBillingBatchDeleteAccount = getBillingBatchDeleteAccount;
exports.postBillingBatchDeleteAccount = postBillingBatchDeleteAccount;

exports.getTransactionsCSV = getTransactionsCSV;
