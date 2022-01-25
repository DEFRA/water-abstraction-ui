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

const getNextStep = (stepKey, chargeElement) => {
  const step = CHARGE_CATEGORY_STEPS[stepKey];
  let { nextStep, nextStepYes } = ROUTING_CONFIG[stepKey];
  let forceNextStep = false;
  if (
    (step === CHARGE_CATEGORY_STEPS.isAdditionalCharges && chargeElement.isAdditionalCharges) ||
    (step === CHARGE_CATEGORY_STEPS.isSupportedSource && chargeElement.isSupportedSource)
  ) {
    nextStep = nextStepYes;
    forceNextStep = true;
  } else if (step === CHARGE_CATEGORY_STEPS.supportedSourceName && chargeElement.supportedSourceName) {
    forceNextStep = true;
  }
  return { nextStep, forceNextStep };
};

const getRedirectPath = (request, stepKey) => {
  const step = CHARGE_CATEGORY_STEPS[stepKey];
  const { licenceId, elementId } = request.params;
  const chargeElement = getChargeElement(request);
  let { chargeVersionWorkflowId, returnToCheckData } = request.query;

  const { nextStep, forceNextStep } = getNextStep(stepKey, chargeElement);

  if (step === CHARGE_CATEGORY_STEPS.isAdjustments) {
    returnToCheckData = true;
  }

  if (returnToCheckData) {
    if (forceNextStep) {
      return routing.getChargeCategoryStep(licenceId, elementId, nextStep, { returnToCheckData, chargeVersionWorkflowId });
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

const postChargeCategoryStep = async (request, h) => {
  const { step, licenceId, elementId } = request.params;
  const { chargeVersionWorkflowId } = request.query;
  const form = getPostedForm(request, forms[step]);
  if (form.isValid) {
    const { draftChargeInformation, supportedSources } = request.pre;
    const chargeElement = getChargeElement(request);
    if (step === CHARGE_CATEGORY_STEPS.isAdjustments) {
      chargeElement.eiucRegion = request.pre.licence.regionalChargeArea.name;
      request.setDraftChargeInformation(licenceId, chargeVersionWorkflowId, draftChargeInformation);
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
