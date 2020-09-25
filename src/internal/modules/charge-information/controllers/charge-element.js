'use-strict';

const sessionForms = require('shared/lib/session-forms');
const formHelpers = require('shared/lib/forms');
const forms = require('../forms/charge-element/index');
const { omit } = require('lodash');
const mappers = require('../lib/charge-elements/mappers');
const dataService = require('../lib/charge-elements/data-service');
const routing = require('../lib/routing');
const { ROUTING_CONFIG } = require('../lib/charge-elements/constants');

const getChargeElementStep = async (request, h) => {
  const { step, licenceId, elementId } = request.params;
  const sessionData = dataService.sessionManager(request, licenceId, elementId);
  return h.view('nunjucks/form', {
    ...request.view,
    caption: `Licence ${request.pre.licence.licenceNumber}`,
    pageTitle: ROUTING_CONFIG[step].pageTitle,
    back: step === 'purpose' ? routing.getUseAbstractionData(request.pre.licence)
      : routing.getChargeElementStep(licenceId, elementId, ROUTING_CONFIG[step].back),
    form: sessionForms.get(request, forms[step].form(request, sessionData))
  });
};

const postChargeElementStep = async (request, h) => {
  const { step, licenceId, elementId } = request.params;
  const schema = forms[step].schema({ ...request.payload, ...request.pre });
  const form = formHelpers.handleRequest(forms[step].form(request), request, schema);
  const { defaultCharges } = request.pre;
  if (form.isValid) {
    const formData = formHelpers.getValues(form);
    // mapp the form data before saving it to the session
    const data = mappers[step] ? mappers[step](formData, defaultCharges) : formData;
    // save the form values in the session except the csrf token
    const sessionData = dataService.sessionManager(request, licenceId, elementId, omit(data, 'csrf_token'));
    if (step === 'loss') {
      dataService.saveCustomCharge(request, licenceId, elementId, sessionData);
      return h.redirect(routing.getCheckData({ id: licenceId }));
    }
    return h.redirect(routing.getChargeElementStep(licenceId, elementId, ROUTING_CONFIG[step].nextStep));
  }
  return h.postRedirectGet(form, routing.getChargeElementStep(licenceId, elementId, step));
};

exports.getChargeElementStep = getChargeElementStep;
exports.postChargeElementStep = postChargeElementStep;
