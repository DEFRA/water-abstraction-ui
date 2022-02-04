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

const getRedirectPath = (request, stepKey, step) => {
  const { licenceId, elementId } = request.params;
  const chargeElement = getChargeElement(request);
  const { chargeVersionWorkflowId, returnToCheckData, additionalChargesAdded } = request.query;
  const queryParams = { returnToCheckData, chargeVersionWorkflowId };
  const checkAnswersRoute = request.pre.draftChargeInformation.status === 'review'
    ? routing.postReview(chargeVersionWorkflowId, licenceId)
    : routing.getCheckData(licenceId, { chargeVersionWorkflowId });

  // Adjustments Page or Is the water supply -- these two steps are both at the end of the flow or subflow
  if ((stepKey === CHARGE_CATEGORY_STEPS.adjustments) || (step === CHARGE_CATEGORY_STEPS.isSupplyPublicWater && returnToCheckData)) {
    return checkAnswersRoute;
  }

  // Additional charges flow start
  if ((step === CHARGE_CATEGORY_STEPS.isAdditionalCharges)) {
    return routing.getAditionalChargesRoute(request, chargeElement, stepKey, checkAnswersRoute);
  }
  // Is a supported source name required
  if (step === CHARGE_CATEGORY_STEPS.isSupportedSource) {
    return routing.getSupportedSourcesRoute(request, chargeElement, stepKey, checkAnswersRoute);
  }

  // supportedSourceName
  if (step === CHARGE_CATEGORY_STEPS.supportedSourceName && returnToCheckData) {
    return additionalChargesAdded
      ? routing.getChargeCategoryStep(licenceId, elementId, ROUTING_CONFIG[stepKey].nextStep, queryParams)
      : checkAnswersRoute;
  }

  return routing.getChargeCategoryStep(licenceId, elementId, ROUTING_CONFIG[stepKey].nextStep, queryParams);
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
    return routing.getChargeCategoryStep(licenceId, elementId, ROUTING_CONFIG.isAdjustments.nextStep, { chargeVersionWorkflowId });
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
      const route = await adjustementsHandler(request, draftChargeInformation, form);
      return h.redirect(route);
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
    return h.redirect(getRedirectPath(request, stepKey, step));
  }

  const queryParams = cleanObject(request.query);

  return h.postRedirectGet(form, routing.getChargeCategoryStep(licenceId, elementId, step), queryParams);
};

exports.getRedirectPath = getRedirectPath;
exports.getChargeCategoryStep = getChargeCategoryStep;
exports.postChargeCategoryStep = postChargeCategoryStep;
