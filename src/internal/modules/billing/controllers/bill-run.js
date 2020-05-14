'use strict';

const uuid = require('uuid/v4');
const { selectBillingTypeForm, billingTypeFormSchema } = require('../forms/billing-type');
const { selectBillingRegionForm, billingRegionFormSchema } = require('../forms/billing-region');
const confirmForm = require('../forms/confirm-form');
const { cancelOrConfirmBatchForm } = require('../forms/cancel-or-confirm-batch');
const services = require('internal/lib/connectors/services');
const forms = require('shared/lib/forms');
const { get, kebabCase, groupBy, sortBy } = require('lodash');
const queryString = require('querystring');
const helpers = require('@envage/water-abstraction-helpers');
const batchService = require('../services/batch-service');
const transactionsCSV = require('../services/transactions-csv');
const csv = require('internal/lib/csv-download');
const { logger } = require('internal/logger');
const mappers = require('../lib/mappers');
const titleCase = require('title-case');
const { pluralize } = require('shared/lib/pluralize');
const urlJoin = require('url-join');
const moment = require('moment');
const Boom = require('@hapi/boom');
const routing = require('../lib/routing');

const { TWO_PART_TARIFF } = require('../lib/bill-run-types');
const seasons = require('../lib/seasons');

const getSessionForm = (request) => {
  return request.yar.get(get(request, 'query.form'));
};

const clearSessionForm = (request) => {
  request.yar.clear(get(request, 'query.form'));
};

const getBillingRegions = async () => {
  const { data } = await services.water.regions.getRegions();
  return data;
};

const getRegionUrl = (selectedBillingType, selectedTwoPartTariffSeason, formKey) => {
  const path = urlJoin(
    '/billing/batch/region',
    kebabCase(selectedBillingType),
    kebabCase(selectedTwoPartTariffSeason)
  );

  return formKey
    ? `${path}?${queryString.stringify({ form: formKey })}`
    : path;
};

const getBatchDetails = (request, billingRegionForm) => {
  const {
    selectedBillingType,
    selectedBillingRegion,
    selectedTwoPartTariffSeason
  } = forms.getValues(billingRegionForm);

  const financialYear = helpers.charging.getFinancialYear();
  const financialYearEnding = selectedTwoPartTariffSeason === seasons.WINTER_AND_ALL_YEAR
    ? financialYear - 1
    : financialYear;

  const batch = {
    userEmail: request.defra.user.user_name,
    regionId: selectedBillingRegion,
    batchType: selectedBillingType,
    financialYearEnding,
    isSummer: selectedTwoPartTariffSeason === seasons.SUMMER
  };
  return batch;
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

/**
 * Step 1b - receive posted step 1a data
 * @param {*} request
 * @param {*} h
 */
const postBillingBatchType = async (request, h) => {
  const billingTypeForm = forms.handleRequest(selectBillingTypeForm(request), request, billingTypeFormSchema(request));

  if (billingTypeForm.isValid) {
    const { selectedBillingType, twoPartTariffSeason } = forms.getValues(billingTypeForm);
    return h.redirect(getRegionUrl(
      selectedBillingType,
      selectedBillingType === TWO_PART_TARIFF ? twoPartTariffSeason : ''
    ));
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
    const { selectedBillingType, selectedTwoPartTariffSeason } = forms.getValues(billingRegionForm);

    const key = uuid();
    request.yar.set(key, billingRegionForm);

    return h.redirect(getRegionUrl(selectedBillingType, selectedTwoPartTariffSeason, key));
  }

  try {
    const batch = getBatchDetails(request, billingRegionForm);
    const { data } = await services.water.billingBatches.createBillingBatch(batch);
    const path = routing.getBillingBatchRoute(data.batch, false);
    return h.redirect(path);
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
    invoices: mapInvoices(batch, invoices),
    isAnnual: batch.type === 'annual',
    isEditable: batch.status === 'ready',
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
    batch,
    batchType: mappers.mapBatchType(batch.type),
    transactions: mappers.mapInvoiceTransactions(invoice, documentIds),
    isCredit: invoice.totals.netTotal < 0,
    caption: `Billing account ${invoice.invoiceAccount.accountNumber}`
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
const getBillingBatchDeleteAccount = async (request, h) => {
  const { batchId, invoiceId } = request.params;
  const { batch } = request.pre;
  const account = await batchService.getBatchInvoice(batchId, invoiceId);
  const action = `/billing/batch/${batchId}/delete-account/${account.id}`;

  return h.view('nunjucks/billing/confirm-page-with-metadata', {
    ...request.view,
    pageTitle: 'You are about to remove this bill from the bill run',
    account,
    form: confirmForm(request, action, 'Remove bill'),
    batch,
    metadataType: 'invoice',
    back: `/billing/batch/${batchId}/summary`
  });
};

const postBillingBatchDeleteAccount = async (request, h) => {
  const { accountId, batchId } = request.params;
  await services.water.billingBatches.deleteAccountFromBatch(batchId, accountId);
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

exports.getBillingBatchProcessing = getBillingBatchProcessing;
exports.getBillingBatchEmpty = getBillingBatchEmpty;
