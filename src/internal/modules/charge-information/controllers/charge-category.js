'use-strict';
const cleanObject = require('../../../../shared/lib/clean-object');
const forms = require('../forms/charge-category/index');
const routing = require('../lib/routing');
const { getDefaultView, getPostedForm, applyFormResponse } = require('../lib/helpers');
const {
  ROUTING_CONFIG,
  CHARGE_CATEGORY_FIRST_STEP, CHARGE_CATEGORY_STEPS, getStepKeyByValue
} = require('../lib/charge-categories/constants');
const actions = require('../lib/actions');
const getChargeElement = request => {
  const { elementId } = request.params;
  const { draftChargeInformation } = request.pre;
  return draftChargeInformation.chargeElements.find(element => element.id === elementId);
};

const getBackLink = (request, step) => {
  const { licenceId, elementId } = request.params;
  const { chargeVersionWorkflowId } = request.query;
  let { back } = ROUTING_CONFIG[step];
  const chargeElement = getChargeElement(request);

  if (step === 'isSupplyPublicWater' && chargeElement.supportedSourceName) {
    back = CHARGE_CATEGORY_STEPS.supportedSourceName;
  }

  if (request.query.returnToCheckData === true) {
    return routing.getCheckData(licenceId);
  }
  return step === CHARGE_CATEGORY_FIRST_STEP
    ? routing.getCheckData(licenceId, { chargeVersionWorkflowId })
    : routing.getChargeCategoryStep(licenceId, elementId, back, { chargeVersionWorkflowId });
};

const getNextStep = (stepKey, chargeElement, query) => {
  let { returnToCheckData, additionalChargesAdded } = query;
  const step = CHARGE_CATEGORY_STEPS[stepKey];
  let { nextStep, nextStepYes } = ROUTING_CONFIG[stepKey];
  let forceNextStep = false;
  if (
    (step === CHARGE_CATEGORY_STEPS.isAdditionalCharges && chargeElement.isAdditionalCharges) ||
    (step === CHARGE_CATEGORY_STEPS.isSupportedSource && chargeElement.isSupportedSource)
  ) {
    nextStep = nextStepYes;
    forceNextStep = true;
  }

  if (returnToCheckData) {
    if (step === CHARGE_CATEGORY_STEPS.isAdditionalCharges) {
      additionalChargesAdded = true;
    }
    if (step === CHARGE_CATEGORY_STEPS.supportedSourceName && additionalChargesAdded) {
      forceNextStep = true;
    }
  }

  if (step === CHARGE_CATEGORY_STEPS.isAdjustments) {
    returnToCheckData = true;
  }

  return { nextStep, forceNextStep, returnToCheckData, additionalChargesAdded };
};

const getRedirectPath = (request, stepKey) => {
  const { licenceId, elementId } = request.params;
  const chargeElement = getChargeElement(request);
  const { chargeVersionWorkflowId } = request.query;

  const { nextStep, forceNextStep, returnToCheckData, additionalChargesAdded } = getNextStep(stepKey, chargeElement, request.query);
  if (stepKey === CHARGE_CATEGORY_STEPS.adjustments) {
    return routing.getCheckData(licenceId, { chargeVersionWorkflowId });
  }

  if (returnToCheckData) {
    if (forceNextStep) {
      const queryParams = { returnToCheckData, chargeVersionWorkflowId };
      if (additionalChargesAdded) {
        queryParams.additionalChargesAdded = additionalChargesAdded;
      }
      return routing.getChargeCategoryStep(licenceId, elementId, nextStep, queryParams);
    }
    if (request.pre.draftChargeInformation.status === 'review') {
      return routing.postReview(chargeVersionWorkflowId, licenceId);
    }
    return routing.getCheckData(licenceId, { chargeVersionWorkflowId });
  }
  return routing.getChargeCategoryStep(licenceId, elementId, nextStep, { chargeVersionWorkflowId });
};

const getChargeCategoryStep = async (request, h) => {
  const { step } = request.params;
  const stepKey = getStepKeyByValue(step);
  return h.view('nunjucks/form', {
    ...getDefaultView(request, getBackLink(request, stepKey), forms[step]),
    pageTitle: ROUTING_CONFIG[stepKey].pageTitle
  });
};

const adjustementsHandler = async (request, draftChargeInformation, form) => {
  const { licenceId, elementId } = request.params;
  const { chargeVersionWorkflowId } = request.query;
  const chargeElement = draftChargeInformation.chargeElements.find(element => element.id === elementId);
  if (request.payload.isAdjustments === 'true') {
    chargeElement.isAdjustments = true;
    await applyFormResponse(request, form, actions.setChargeElementData);
    return routing.getChargeCategoryStep(licenceId, elementId, ROUTING_CONFIG.isAdjustments.nextStep);
  } else {
    chargeElement.isAdjustments = false;
    chargeElement.adjustments = {};
    request.setDraftChargeInformation(licenceId, chargeVersionWorkflowId, draftChargeInformation);
    return routing.getCheckData(licenceId);
  }
};

const postChargeCategoryStep = async (request, h) => {
  const { step, licenceId, elementId } = request.params;
  const { chargeVersionWorkflowId } = request.query;
  const form = getPostedForm(request, forms[step]);
  if (form.isValid) {
    const { draftChargeInformation, supportedSources } = request.pre;
    const chargeElement = draftChargeInformation.chargeElements.find(element => element.id === elementId);
    if (step === CHARGE_CATEGORY_STEPS.isAdjustments) {
      const some = await adjustementsHandler(request, draftChargeInformation, form);
      return h.redirect(some);
    } else if (step === CHARGE_CATEGORY_STEPS.isSupportedSource) {
      if (request.payload.isSupportedSource === 'false') {
        delete chargeElement.supportedSourceName;
        request.setDraftChargeInformation(licenceId, chargeVersionWorkflowId, draftChargeInformation);
      }
    } else if (step === CHARGE_CATEGORY_STEPS.supportedSourceName) {
      const { supportedSourceId } = request.payload;
      const supportedSource = supportedSources.find(({ id }) => id === supportedSourceId);
      chargeElement.supportedSourceName = supportedSource.name;
      request.setDraftChargeInformation(licenceId, chargeVersionWorkflowId, draftChargeInformation);
    }
    await applyFormResponse(request, form, actions.setChargeElementData);
    const stepKey = getStepKeyByValue(step);
    return h.redirect(getRedirectPath(request, stepKey));
  }

  const queryParams = cleanObject(request.query);

  return h.postRedirectGet(form, routing.getChargeCategoryStep(licenceId, elementId, step), queryParams);
};

exports.getRedirectPath = getRedirectPath;
exports.getChargeCategoryStep = getChargeCategoryStep;
exports.postChargeCategoryStep = postChargeCategoryStep;
