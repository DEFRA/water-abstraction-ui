'use-strict';

const { get } = require('lodash');

const cleanObject = require('../../../../shared/lib/clean-object');

const { getChargeElementData } = require('../lib/form-helpers');
const forms = require('../forms/charge-element/index');
const routing = require('../lib/routing');
const { getDefaultView, getPostedForm, applyFormResponse } = require('../lib/helpers');
const { ROUTING_CONFIG,
  CHARGE_ELEMENT_FIRST_STEP,
  CHARGE_ELEMENT_STEPS } = require('../lib/charge-elements/constants');
const actions = require('../lib/actions');

const getBackLink = request => {
  const { step, licenceId, elementId } = request.params;
  const { chargeVersionWorkflowId } = request.query;
  if (request.query.returnToCheckData) {
    return routing.getCheckData(licenceId);
  }
  return step === CHARGE_ELEMENT_FIRST_STEP
    ? routing.getUseAbstractionData(licenceId, { chargeVersionWorkflowId })
    : routing.getChargeElementStep(licenceId, elementId, ROUTING_CONFIG[step].back, { chargeVersionWorkflowId });
};

const getRedirectPath = request => {
  const { step, licenceId, elementId } = request.params;

  // For TPT purposes only, show the element-level agreements override page
  const chargeElement = getChargeElementData(request);
  const lastStep = get(chargeElement, 'purposeUse.isTwoPartTariff')
    ? CHARGE_ELEMENT_STEPS.agreements
    : CHARGE_ELEMENT_STEPS.loss;

  const { chargeVersionWorkflowId, returnToCheckData } = request.query;
  if (returnToCheckData || step === lastStep) {
    if (request.pre.draftChargeInformation.status === 'review') {
      return routing.postReview(chargeVersionWorkflowId, licenceId);
    }
    return routing.getCheckData(licenceId, { chargeVersionWorkflowId });
  }
  return routing.getChargeElementStep(licenceId, elementId, ROUTING_CONFIG[step].nextStep, { chargeVersionWorkflowId });
};

const getChargeElementStep = async (request, h) => {
  const { step } = request.params;
  return h.view('nunjucks/form', {
    ...getDefaultView(request, getBackLink(request), forms[step]),
    pageTitle: ROUTING_CONFIG[step].pageTitle
  });
};

const postChargeElementStep = async (request, h) => {
  const { step, licenceId, elementId } = request.params;
  const { categoryId } = request.query;

  const form = getPostedForm(request, forms[step]);

  if (form.isValid) {
    const action = categoryId === ''
      ? actions.setChargeElementData
      : actions.setChargePurposeData;
    await applyFormResponse(request, form, action);
    return h.redirect(getRedirectPath(request));
  }

  const queryParams = cleanObject(request.query);

  return h.postRedirectGet(form, routing.getChargeElementStep(licenceId, elementId, step), queryParams);
};

exports.getChargeElementStep = getChargeElementStep;
exports.postChargeElementStep = postChargeElementStep;
