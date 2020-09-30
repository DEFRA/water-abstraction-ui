'use-strict';

const formHelpers = require('shared/lib/forms');
const forms = require('../forms/charge-element/index');
const routing = require('../lib/routing');
const helpers = require('../lib/charge-elements/helpers');
const { getDefaultView } = require('../lib/helpers');
const { ROUTING_CONFIG,
  CHARGE_ELEMENT_FIRST_STEP,
  CHARGE_ELEMENT_LAST_STEP } = require('../lib/charge-elements/constants');

const getBackLink = request => {
  const { step, licenceId, elementId } = request.params;
  if (request.query.returnToCheckData === 1) {
    return routing.getCheckData(licenceId);
  }
  return step === CHARGE_ELEMENT_FIRST_STEP
    ? routing.getUseAbstractionData(licenceId)
    : routing.getChargeElementStep(licenceId, elementId, ROUTING_CONFIG[step].back);
};

const getRedirectPath = request => {
  const { step, licenceId, elementId } = request.params;
  console.log(request.query);
  if (request.query.returnToCheckData === 1 || step === CHARGE_ELEMENT_LAST_STEP) {
    return routing.getCheckData(licenceId);
  }
  return routing.getChargeElementStep(licenceId, elementId, ROUTING_CONFIG[step].nextStep);
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
  const form = formHelpers.handleRequest(
    forms[step].form(request),
    request,
    forms[step].schema(request)
  );

  if (form.isValid) {
    helpers.saveChargeElementInformation(form, request);
    return h.redirect(getRedirectPath(request));
  }

  return h.postRedirectGet(form, routing.getChargeElementStep(licenceId, elementId, step));
};

exports.getChargeElementStep = getChargeElementStep;
exports.postChargeElementStep = postChargeElementStep;
