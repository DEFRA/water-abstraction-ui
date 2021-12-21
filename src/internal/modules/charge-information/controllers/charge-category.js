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
  const { step, licenceId, elementId } = request.params;
  const { chargeVersionWorkflowId } = request.query;
  if (request.query.returnToCheckData === true) {
    return routing.getCheckData(licenceId);
  }
  return step === CHARGE_CATEGORY_FIRST_STEP
    ? routing.getCheckData(licenceId, { chargeVersionWorkflowId })
    : routing.getChargeCategoryStep(licenceId, elementId, ROUTING_CONFIG[step].back, { chargeVersionWorkflowId });
};

const getRedirectPath = request => {
  const { step, licenceId, elementId } = request.params;

  const { chargeVersionWorkflowId, returnToCheckData } = request.query;
  if (returnToCheckData || (step === CHARGE_CATEGORY_STEPS.adjustments && request.payload.adjustments === 'false')) {
    if (request.pre.draftChargeInformation.status === 'review') {
      return routing.postReview(chargeVersionWorkflowId, licenceId);
    }
    return routing.getCheckData(licenceId, { chargeVersionWorkflowId });
  }
  return routing.getChargeCategoryStep(licenceId, elementId, ROUTING_CONFIG[step].nextStep, { chargeVersionWorkflowId });
};

const getChargeCategoryStep = async (request, h) => {
  const { step } = request.params;
  return h.view('nunjucks/form', {
    ...getDefaultView(request, getBackLink(request), forms[step]),
    pageTitle: ROUTING_CONFIG[step].pageTitle
  });
};

const findChargeReference = async chargeElement => {
  const keys = ['source', 'loss', 'availability', 'model', 'volume'];
  const chargeReference = await services.water.chargeCategories.getChargeCategory(pick(chargeElement, keys));
  return {
    id: chargeReference.billingChargeCategoryId,
    reference: chargeReference.reference,
    description: chargeReference.shortDescription
  };
};

const postChargeCategoryStep = async (request, h) => {
  const { step, licenceId, elementId } = request.params;
  const { chargeVersionWorkflowId } = request.query;

  const form = getPostedForm(request, forms[step]);
  if (form.isValid) {
    if (step === CHARGE_CATEGORY_STEPS.adjustments && request.payload.adjustments === 'No') {
      const { draftChargeInformation } = request.pre;
      const chargeElement = draftChargeInformation.chargeElements.find(element => element.id === elementId);
      chargeElement.chargeReference = await findChargeReference(chargeElement);
      chargeElement.adjustments = 'No';
      request.setDraftChargeInformation(licenceId, chargeVersionWorkflowId, draftChargeInformation);
      return h.redirect(routing.getCheckData(licenceId, { chargeVersionWorkflowId }));
    }
    await applyFormResponse(request, form, actions.setChargeElementData);
    return h.redirect(getRedirectPath(request));
  }

  const queryParams = cleanObject(request.query);

  return h.postRedirectGet(form, routing.getChargeCategoryStep(licenceId, elementId, step), queryParams);
};

exports.getChargeCategoryStep = getChargeCategoryStep;
exports.postChargeCategoryStep = postChargeCategoryStep;
