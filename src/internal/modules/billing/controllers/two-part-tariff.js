'use strict';

const services = require('internal/lib/connectors/services');
const twoPartTariffQuantityForm = require('../forms/two-part-tariff-quantity');
const confirmForm = require('shared/lib/forms/confirm-form');
const mappers = require('../lib/mappers');
const twoPartTariff = require('../lib/two-part-tariff');
const routing = require('../lib/routing');
const { groupBy } = require('lodash');

const forms = require('shared/lib/forms');

const getTwoPartTariffReview = async (request, h) => {
  const { batch } = request.pre;

  const licencesData = await services.water.billingBatches.getBatchLicences(batch.id);

  // Get totals of licences with/without errors
  const totals = twoPartTariff.getTotals(licencesData);

  // group by licence for mid year transfers or inversions
  const licenceGroups = Object.values(groupBy(licencesData, 'licenceRef'));
  // gets 2pt matching error messages and define error types
  const licences = licenceGroups.map(licenceGroup => twoPartTariff.mapLicence(batch, licenceGroup));

  return h.view('nunjucks/billing/two-part-tariff-review', {
    ...request.view,
    batch,
    reviewLink: `/billing/batch/${batch.id}/two-part-tariff-review`,
    readyLink: `/billing/batch/${batch.id}/two-part-tariff-ready`,
    licences,
    totals,
    back: `/billing/batch/list`
  });
};

/**
 * Allows user to view issues with a single invoice licence
 */
const getLicenceReview = async (request, h) => {
  const { batch, licence } = request.pre;
  const { licenceId, action } = request.params;
  const licenceData = await getCurrentLicenceData(licence.licenceNumber);

  const backLinkTail = action === 'review' ? 'review' : 'ready';

  const billingVolumeData = await services.water.billingBatches.getBatchLicenceBillingVolumes(batch.id, licenceId);
  const totals = twoPartTariff.getTotals(billingVolumeData);
  const billingVolumeGroups = twoPartTariff.decorateBillingVolumes(batch, licence, billingVolumeData);
  return h.view('nunjucks/billing/two-part-tariff-licence-review', {
    ...request.view,
    pageTitle: `Review data issues for ${licence.licenceNumber}`,
    batch,
    licence,
    ...licenceData,
    billingVolumeGroups,
    totals,
    back: `/billing/batch/${batch.id}/two-part-tariff-${backLinkTail}`
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

/**
 * Allows user to set two-part tariff return quantities during
 * two-part tariff review
 */
const getBillingVolumeReview = async (request, h, form) => {
  const { batch, licence, billingVolume } = request.pre;
  const { chargePeriod } = billingVolume.chargePeriod;

  return h.view('nunjucks/billing/two-part-tariff-quantities', {
    licence,
    ...request.view,
    pageTitle: 'Set the billable returns quantity for this bill run',
    caption: `${billingVolume.chargeElement.purposeUse.name}, ${billingVolume.chargeElement.description}`,
    billingVolume,
    chargePeriod,
    form: form || twoPartTariffQuantityForm.form(request, billingVolume),
    back: `/billing/batch/${batch.id}/two-part-tariff/licence/${licence.id}`
  });
};

/**
 * Gets the user-selected quantity from the form
 * @param {Object} form - the set quantities form
 * @param {Object} billingVolume - from water service
 * @return {Number} returns the quantity selected by user
 */
const getFormQuantity = (form, billingVolume) => {
  const { quantity, customQuantity } = forms.getValues(form);
  if (quantity === 'authorised') {
    return billingVolume.chargeElement.authorisedAnnualQuantity;
  }
  return customQuantity;
};

/**
 * Post handler for quantities form
 */
const postBillingVolumeReview = async (request, h) => {
  const { batch, billingVolume, licence } = request.pre;

  const form = forms.handleRequest(
    twoPartTariffQuantityForm.form(request, billingVolume),
    request,
    twoPartTariffQuantityForm.schema(billingVolume)
  );

  if (form.isValid) {
    const quantity = getFormQuantity(form, billingVolume);

    await services.water.billingVolumes.updateVolume(billingVolume.id, quantity);

    // If all TPT errors are resolved, go to main TPT batch review screen
    // If there are still errors, go back to the licence page.
    const billingVolumes = await services.water.billingBatches.getBatchLicenceBillingVolumes(batch.id, licence.id);
    const hasErrors = billingVolumes.some(row => row.twoPartTariffError);

    const path = hasErrors
      ? routing.getTwoPartTariffLicenceReviewRoute(batch, licence.id)
      : routing.getBillingBatchRoute(batch);

    return h.redirect(path);
  }
  return getBillingVolumeReview(request, h, form);
};

/**
 * Confirm removal of licence from TPT return
 */
const getRemoveLicence = async (request, h) => {
  const { batch, licence } = request.pre;

  // Confirm form
  const action = `/billing/batch/${batch.id}/two-part-tariff/licence/${licence.id}/remove`;
  const form = confirmForm.form(request, 'Remove licence', action);

  return h.view('nunjucks/billing/confirm-licence', {
    ...request.view,
    ...request.pre,
    form,
    pageTitle: `You're about to remove this licence from the bill run`,
    back: `/billing/batch/${batch.id}/two-part-tariff/licence/${licence.id}`
  });
};

/**
 * Post handler for deleting licence from bill run
 */
const postRemoveLicence = async (request, h) => {
  const { batchId, licenceId } = request.params;

  // Delete licence from batch
  await services.water.billingBatches.deleteBatchLicence(batchId, licenceId);

  // Redirect
  const path = `/billing/batch/${batchId}/two-part-tariff-review`;
  return h.redirect(path);
};

const getApproveReview = (request, h) => {
  const { batch } = request.pre;

  const action = `/billing/batch/${batch.id}/approve-review`;
  const form = confirmForm.form(request, 'Confirm', action);

  return h.view('nunjucks/billing/confirm-batch', {
    ...request.view,
    batch,
    form,
    pageTitle: 'You\'re about to generate the two-part tariff bills',
    back: `/billing/batch/${batch.id}/two-part-tariff-ready`
  });
};

const postApproveReview = async (request, h) => {
  const { batchId } = request.params;
  const { data: { batch } } = await services.water.billingBatches.approveBatchReview(batchId);
  return h.redirect(routing.getBillingBatchRoute(batch, { isBackEnabled: true }));
};

exports.getTwoPartTariffReview = getTwoPartTariffReview;
exports.getLicenceReview = getLicenceReview;
exports.getBillingVolumeReview = getBillingVolumeReview;
exports.postBillingVolumeReview = postBillingVolumeReview;
exports.getRemoveLicence = getRemoveLicence;
exports.postRemoveLicence = postRemoveLicence;
exports.getApproveReview = getApproveReview;
exports.postApproveReview = postApproveReview;
