const { groupBy, find } = require('lodash');
const Boom = require('@hapi/boom');
const services = require('internal/lib/connectors/services');
const twoPartTariffQuantityForm = require('../forms/two-part-tariff-quantity');
const twoPartTariffQuantityConfirmForm = require('../forms/two-part-tariff-quantity-confirm');
const mappers = require('../lib/mappers');

const forms = require('shared/lib/forms');

const messages = {
  10: 'No returns submitted',
  20: 'Under query',
  30: 'Received',
  40: 'Some returns are due',
  50: 'Late returns',
  60: 'Over abstraction'
};

const getTotals = licences => {
  const errors = licences.reduce((acc, row) => (
    row.twoPartTariffError ? acc + 1 : acc
  ), 0);

  const totals = {
    errors,
    ready: licences.length - errors,
    total: licences.length
  };
  return totals;
};

const getErrorString = errorCodes => errorCodes.reduce((acc, code) => {
  return acc ? 'Multiple errors' : messages[code];
}, null);

const getLicenceFilter = action => {
  const isError = action === 'review';
  return row => row.twoPartTariffError === isError;
};

const getTwoPartTariffAction = async (request, h, action) => {
  const { batch } = request.pre;
  const licencesData = await services.water.billingBatches.getBatchLicences(batch.id);

  // Get totals of licences with/without errors
  const totals = getTotals(licencesData);

  // gets 2pt matching error messages and define error types
  const licences = licencesData
    .filter(getLicenceFilter(action))
    .map(licence => ({
      ...licence,
      twoPartTariffStatuses: getErrorString(licence.twoPartTariffStatuses),
      link: `/billing/batch/${batch.id}/two-part-tariff/licence/${licence.billingInvoiceLicenceId}`
    }));

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

const getTwoPartTariffReview = async (request, h) => getTwoPartTariffAction(request, h, 'review');
const getTwoPartTariffViewReady = async (request, h) => getTwoPartTariffAction(request, h, 'ready');

/**
 * Creates a unique group string for the given transaction, based on the
 * purpose and abstraction period
 * @param {Object} transaction
 * @return {String} unique key
 */
const getTransactionGroup = transaction => {
  const { chargeElement } = transaction;
  const { startDay, startMonth, endDay, endMonth } = chargeElement.abstractionPeriod;
  return `${chargeElement.purposeUse.code}_${startDay}_${startMonth}_${endDay}_${endMonth}`;
};

/**
 * Decorates transactions with edit link and error message,
 * then groups them by purpose/abstraction period
 * @param {Object} batch
 * @param {Object} invoiceLicence
 * @return {Array} an array of transaction objects
 */
const getTransactionGroups = (batch, invoiceLicence) => {
  // Add 2PT error message
  const transactions = invoiceLicence.transactions.map(transaction => ({
    ...transaction,
    editLink: `/billing/batch/${batch.id}/two-part-tariff/licence/${invoiceLicence.id}/transaction/${transaction.id}`,
    error: transaction.twoPartTariffError && messages[transaction.twoPartTariffStatus]
  }));

  // Group by purpose use and abs period
  return Object.values(
    groupBy(transactions, getTransactionGroup)
  );
};

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
    transactionGroups: getTransactionGroups(batch, invoiceLicence),
    back: `/billing/batch/${batch.id}/two-part-tariff-review`,
    removeLink: `/billing/batch/${batch.id}/two-part-tariff-remove-licence/${invoiceLicence.id}`
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
    error: messages[transaction.twoPartTariffStatus],
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
  const { quantity } = request.payload;
  await services.water.billingTransactions.updateVolume(transaction.id, quantity);
  return h.redirect(`/billing/batch/${batch.id}/two-part-tariff/licence/${invoiceLicence.id}`);
};

exports.getTwoPartTariffReview = getTwoPartTariffReview;
exports.getTwoPartTariffViewReady = getTwoPartTariffViewReady;
exports.getLicenceReview = getLicenceReview;
exports.getTransactionReview = getTransactionReview;
exports.postTransactionReview = postTransactionReview;
exports.getConfirmQuantity = getConfirmQuantity;
exports.postConfirmQuantity = postConfirmQuantity;
