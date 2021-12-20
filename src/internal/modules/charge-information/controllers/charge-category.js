'use-strict';
const cleanObject = require('../../../../shared/lib/clean-object');
const { pick } = require('lodash');
const forms = require('../forms/charge-category/index');
const routing = require('../lib/routing');
const services = require('../../../lib/connectors/services');
const { getDefaultView, getPostedForm, applyFormResponse } = require('../lib/helpers');
const { ROUTING_CONFIG,
  CHARGE_CATEGORY_FIRST_STEP, CHARGE_CATEGORY_STEPS } = require('../lib/charge-categories/constants');
const actions = require('../lib/actions');

const getBackLink = request => {
  const { step, licenceId, categoryId } = request.params;
  const { chargeVersionWorkflowId } = request.query;
  if (request.query.returnToCheckData === 1) {
    return routing.getCheckData(licenceId);
  }
  return step === CHARGE_CATEGORY_FIRST_STEP
    ? routing.getUseAbstractionData(licenceId, { chargeVersionWorkflowId })
    : routing.getChargeCategoryStep(licenceId, categoryId, ROUTING_CONFIG[step].back, { chargeVersionWorkflowId });
};

const getRedirectPath = request => {
  const { step, licenceId, categoryId } = request.params;

  const { chargeVersionWorkflowId, returnToCheckData } = request.query;
  if (returnToCheckData || (step === CHARGE_CATEGORY_STEPS.adjustments && request.payload.adjustments === 'false')) {
    if (request.pre.draftChargeInformation.status === 'review') {
      return routing.postReview(chargeVersionWorkflowId, licenceId);
    }
    return routing.getCheckData(licenceId, { chargeVersionWorkflowId });
  }
  return routing.getChargeCategoryStep(licenceId, categoryId, ROUTING_CONFIG[step].nextStep, { chargeVersionWorkflowId });
};

const getChargeCategoryStep = async (request, h) => {
  const { step } = request.params;
  return h.view('nunjucks/form', {
    ...getDefaultView(request, getBackLink(request), forms[step]),
    pageTitle: ROUTING_CONFIG[step].pageTitle
  });
};

const findChargeReference = async chargeCategory => {
  const keys = ['source', 'loss', 'availability', 'model', 'volume'];
  const chargeReference = await services.water.chargeCategories.getChargeCategory(pick(chargeCategory, keys));
  chargeReference.shortDescription = `${chargeCategory.loss} loss, ${chargeCategory.source} abstraction, below ${chargeCategory.volume}ml per year`;
  return {
    id: chargeReference.billingChargeCategoryId,
    reference: chargeReference.reference,
    description: chargeReference.shortDescription
  };
};

const postChargeCategoryStep = async (request, h) => {
  const { step, licenceId, categoryId } = request.params;
  const { chargeVersionWorkflowId } = request.query;

  const form = getPostedForm(request, forms[step]);

  if (form.isValid) {
    if (step === CHARGE_CATEGORY_STEPS.adjustments && request.payload.adjustments === 'false') {
      const { draftChargeInformation } = request.pre;
      const chargeCategory = draftChargeInformation.chargeCategories.find(category => category.id === categoryId);
      chargeCategory.chargeReference = await findChargeReference(chargeCategory);
      request.setDraftChargeInformation(licenceId, chargeVersionWorkflowId, draftChargeInformation);
      return h.redirect(routing.getCheckData(licenceId, { chargeVersionWorkflowId }));
    }
    await applyFormResponse(request, form, actions.setChargeCategoryData);
    return h.redirect(getRedirectPath(request));
  }

  const queryParams = cleanObject(request.query);

  return h.postRedirectGet(form, routing.getChargeCategoryStep(licenceId, categoryId, step), queryParams);
};

exports.getChargeCategoryStep = getChargeCategoryStep;
exports.postChargeCategoryStep = postChargeCategoryStep;
