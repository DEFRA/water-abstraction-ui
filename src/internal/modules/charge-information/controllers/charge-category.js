'use-strict';
const cleanObject = require('../../../../shared/lib/clean-object');
const { pick } = require('lodash');
const forms = require('../forms/charge-category/index');
const routing = require('../lib/routing');
const services = require('../../../lib/connectors/services');
const { getDefaultView, getPostedForm, applyFormResponse } = require('../lib/helpers');
const { ROUTING_CONFIG,
  CHARGE_CATEGORY_FIRST_STEP, CHARGE_CATEGORY_STEPS, getStepKeyByValue } = require('../lib/charge-categories/constants');
const actions = require('../lib/actions');

const getBackLink = (request, step) => {
  const { licenceId, elementId } = request.params;
  const { chargeVersionWorkflowId } = request.query;
  if (request.query.returnToCheckData === true) {
    return routing.getCheckData(licenceId);
  }
  return step === CHARGE_CATEGORY_FIRST_STEP
    ? routing.getCheckData(licenceId, { chargeVersionWorkflowId })
    : routing.getChargeCategoryStep(licenceId, elementId, ROUTING_CONFIG[step].back, { chargeVersionWorkflowId });
};

const getRedirectPath = (request, step) => {
  const { licenceId, elementId } = request.params;

  const { chargeVersionWorkflowId, returnToCheckData } = request.query;
  if (returnToCheckData || (step === 'isAdjustments')) {
    if (request.pre.draftChargeInformation.status === 'review') {
      return routing.postReview(chargeVersionWorkflowId, licenceId);
    }
    return routing.getCheckData(licenceId, { chargeVersionWorkflowId });
  }
  return routing.getChargeCategoryStep(licenceId, elementId, ROUTING_CONFIG[step].nextStep, { chargeVersionWorkflowId });
};

const getChargeCategoryStep = async (request, h) => {
  const { step } = request.params;
  const stepKey = getStepKeyByValue(step);
  return h.view('nunjucks/form', {
    ...getDefaultView(request, getBackLink(request, stepKey), forms[step]),
    pageTitle: ROUTING_CONFIG[stepKey].pageTitle
  });
};

const findChargeCategory = async chargeElement => {
  const keys = ['source', 'loss', 'isRestrictedSource', 'waterModel', 'volume'];
  const chargeCategory = await services.water.chargeCategories.getChargeCategory(pick(chargeElement, keys));
  return {
    id: chargeCategory.billingChargeCategoryId,
    reference: chargeCategory.reference,
    shortDescription: chargeCategory.shortDescription
  };
};

const postChargeCategoryStep = async (request, h) => {
  const { step, licenceId, elementId } = request.params;
  const stepKey = getStepKeyByValue(step);
  const { chargeVersionWorkflowId } = request.query;
  const form = getPostedForm(request, forms[step]);
  if (form.isValid) {
    if (step === CHARGE_CATEGORY_STEPS.isAdjustments) {
      const { draftChargeInformation } = request.pre;
      const chargeElement = draftChargeInformation.chargeElements.find(element => element.id === elementId);
      // find the charge reference and save it in the session cache
      chargeElement.chargeCategory = await findChargeCategory(chargeElement);
      chargeElement.eiucRegion = request.pre.licence.regionalChargeArea.name;
      request.setDraftChargeInformation(licenceId, chargeVersionWorkflowId, draftChargeInformation);
    }
    await applyFormResponse(request, form, actions.setChargeElementData);
    return h.redirect(getRedirectPath(request, stepKey));
  }

  const queryParams = cleanObject(request.query);

  return h.postRedirectGet(form, routing.getChargeCategoryStep(licenceId, elementId, step), queryParams);
};

exports.getChargeCategoryStep = getChargeCategoryStep;
exports.postChargeCategoryStep = postChargeCategoryStep;
