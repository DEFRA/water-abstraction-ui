const { find, partialRight } = require('lodash');
const Boom = require('@hapi/boom');
const services = require('internal/lib/connectors/services');
const twoPartTariffQuantityForm = require('../forms/two-part-tariff-quantity');
const twoPartTariffQuantityConfirmForm = require('../forms/two-part-tariff-quantity-confirm');
const confirmForm = require('../forms/confirm-form');
const mappers = require('../lib/mappers');
const twoPartTariff = require('../lib/two-part-tariff');
const routing = require('../lib/routing');

const forms = require('shared/lib/forms');

const getLicenceFilter = action => {
  const isError = action === 'review';
  return row => row.twoPartTariffError === isError;
};

const getTwoPartTariffAction = async (request, h, action) => {
  const { batch } = request.pre;

  const licencesData = await services.water.billingBatches.getBatchLicences(batch.id);

  // Get totals of licences with/without errors
  const totals = twoPartTariff.getTotals(licencesData);

  // if there are no errors, show ready page
  if (totals.errors === 0) action = 'ready';

  // gets 2pt matching error messages and define error types
  const licences = licencesData
    .filter(getLicenceFilter(action))
    .map(licence => twoPartTariff.mapLicence(batch, licence));

  return h.view('nunjucks/billing/two-part-tariff-' + action, {
    ...request.view,
    batch,
    reviewLink: `/billing/batch/${batch.id}/two-part-tariff-review`,
    readyLink: `/billing/batch/${batch.id}/two-part-tariff-ready`,
    licences,
    totals,
    back: `/billing/batch/list`
  });
};

const getTwoPartTariffReview = partialRight(getTwoPartTariffAction, 'review');
const getTwoPartTariffViewReady = partialRight(getTwoPartTariffAction, 'ready');

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
    invoiceLicence,
    transactionGroups: twoPartTariff.getTransactionGroups(batch, invoiceLicence),
    back: `/billing/batch/${batch.id}/two-part-tariff-review`
  });
};

/**
 * Gets current data about the current licence version
 * @param {String} licenceRef - licence number
 * @return {Promise<Object>} resolves with licence summary and conditions
 */
const getCurrentLicenceData = async licenceRef => {
  const doc = await services.crm.documents.getWaterLicence(licenceRef);
  if (doc) {
    const summary = await services.water.licences.getSummaryByDocumentId(doc.document_id);

    const aggregateConditions = mappers.mapConditions(summary.data.conditions.filter(row => row.code === 'AGG'));

    return {
      returnsLink: `/licences/${doc.document_id}/returns`,
      aggregateConditions,
      aggregateQuantity: summary.data.aggregateQuantity
    };
  }
};

const getRequestTransaction = request => {
  const { transactionId } = request.params;
  const transaction = find(request.pre.invoiceLicence.transactions, { id: transactionId });
  if (!transaction) {
    throw Boom.notFound(`Transaction ${transactionId} not found`);
  }
  return transaction;
};

/**
 * Allows user to set two-part tariff return quantities during
 * two-part tariff review
 */
const getTransactionReview = async (request, h, form) => {
  const { batch, invoiceLicence } = request.pre;

  const transaction = getRequestTransaction(request);
  const licenceData = await getCurrentLicenceData(invoiceLicence.licence.licenceNumber);

  return h.view('nunjucks/billing/two-part-tariff-quantities', {
    error: twoPartTariff.getTransactionError(transaction),
    invoiceLicence,
    ...request.view,
    pageTitle: `Review billable quantity ${transaction.chargeElement.description}`,
    ...licenceData,
    transaction,
    form: form || twoPartTariffQuantityForm.form(request, transaction),
    back: `/billing/batch/${batch.id}/two-part-tariff-review/${invoiceLicence.id}`
  });
};

/**
 * Gets the user-selected quantity from the form
 * @param {Object} form - the set quantities form
 * @param {Object} transaction - from water service
 * @return {Number} returns the quantity selected by user
 */
const getFormQuantity = (form, transaction) => {
  const { quantity, customQuantity } = forms.getValues(form);
  if (quantity === 'authorised') {
    return transaction.chargeElement.authorisedAnnualQuantity;
  }
  return customQuantity;
};

/**
 * Post handler for quantities form
 */
const postTransactionReview = async (request, h) => {
  const { batch, invoiceLicence } = request.pre;
  const transaction = getRequestTransaction(request);

  const form = forms.handleRequest(
    twoPartTariffQuantityForm.form(request, transaction),
    request,
    twoPartTariffQuantityForm.schema(transaction)
  );

  if (form.isValid) {
    const quantity = getFormQuantity(form, transaction);
    const path = `/billing/batch/${batch.id}/two-part-tariff/licence/${invoiceLicence.id}/transaction/${transaction.id}/confirm?quantity=${quantity}`;
    return h.redirect(path);
  }
  return getTransactionReview(request, h, form);
};

/**
 * Confirmation step when quantity is selected
 */
const getConfirmQuantity = async (request, h) => {
  const { batch, invoiceLicence } = request.pre;
  const { quantity } = request.query;

  const transaction = getRequestTransaction(request);

  const form = twoPartTariffQuantityConfirmForm.form(request, quantity);

  return h.view('nunjucks/billing/two-part-tariff-quantities-confirm', {
    ...request.view,
    quantity,
    invoiceLicence,
    form,
    pageTitle: `You are about to set the billable quantity to ${quantity}ML`,
    back: `/billing/batch/${batch.id}/two-part-tariff-licence-review/${invoiceLicence.id}/transaction/${transaction.id}`
  });
};

/**
 * Post handler for confirming billable volume
 * Updates the quantity in the water service
 */
const postConfirmQuantity = async (request, h) => {
  const { batch, invoiceLicence } = request.pre;
  const transaction = getRequestTransaction(request);

  const schema = twoPartTariffQuantityConfirmForm.schema(transaction);
  const form = forms.handleRequest(twoPartTariffQuantityConfirmForm.form(request), request, schema);

  if (form.isValid) {
    const { quantity } = forms.getValues(form);
    await services.water.billingTransactions.updateVolume(transaction.id, quantity);

    // If all TPT errors are resolved, go to main TPT batch review screen
    // If there are still errors, go back to the licence page.
    const { transactions } = await services.water.billingInvoiceLicences.getInvoiceLicence(invoiceLicence.id);
    const hasErrors = transactions.some(row => row.twoPartTariffError);

    const path = hasErrors
      ? routing.getTwoPartTariffLicenceReviewRoute(batch, invoiceLicence.id)
      : routing.getBillingBatchRoute(batch);

    return h.redirect(path);
  }

  return Boom.badRequest();
};

/**
 * Confirm removal of licence from TPT return
 */
const getRemoveLicence = async (request, h) => {
  const { batch, invoiceLicence } = request.pre;

  // Confirm form
  const action = `/billing/batch/${batch.id}/two-part-tariff/licence/${invoiceLicence.id}/remove`;
  const form = confirmForm(request, action, 'Remove licence');

  return h.view('nunjucks/billing/confirm-page-with-metadata', {
    ...request.view,
    ...request.pre,
    form,
    metadataType: 'licence',
    pageTitle: `You are about to remove this licence from the bill run`,
    back: `/billing/batch/${batch.id}/two-part-tariff/licence/${invoiceLicence.id}`
  });
};

/**
 * Post handler for deleting licence from bill run
 */
const postRemoveLicence = async (request, h) => {
  const { batchId, invoiceLicenceId } = request.params;

  // Delete invoiceLicence from batch
  await services.water.billingInvoiceLicences.deleteInvoiceLicence(invoiceLicenceId);

  // Redirect
  const path = `/billing/batch/${batchId}/two-part-tariff-review`;
  return h.redirect(path);
};

const getApproveReview = (request, h) => {
  const { batch } = request.pre;

  const action = `/billing/batch/${batch.id}/approve-review`;
  const form = confirmForm(request, action, 'Confirm');

  return h.view('nunjucks/billing/confirm-page-with-metadata', {
    ...request.view,
    batch,
    form,
    metadataType: 'batch',
    pageTitle: 'You are about to generate the two-part tariff bills',
    back: `/billing/batch/${batch.id}/two-part-tariff-ready`
  });
};

const postApproveReview = async (request, h) => {
  const { batchId } = request.params;
  const { data: { batch } } = await services.water.billingBatches.approveBatchReview(batchId);
  return h.redirect(routing.getBillingBatchRoute(batch));
};

exports.getTwoPartTariffReview = getTwoPartTariffReview;
exports.getTwoPartTariffViewReady = getTwoPartTariffViewReady;
exports.getLicenceReview = getLicenceReview;
exports.getTransactionReview = getTransactionReview;
exports.postTransactionReview = postTransactionReview;
exports.getConfirmQuantity = getConfirmQuantity;
exports.postConfirmQuantity = postConfirmQuantity;
exports.getRemoveLicence = getRemoveLicence;
exports.postRemoveLicence = postRemoveLicence;
exports.getApproveReview = getApproveReview;
exports.postApproveReview = postApproveReview;
