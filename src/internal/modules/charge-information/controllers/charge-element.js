'use-strict';

const sessionForms = require('shared/lib/session-forms');
const formHelpers = require('shared/lib/forms');
const forms = require('../forms/charge-element/index');
const { omit } = require('lodash');
const mappers = require('../lib/charge-elements/mappers');
const dataservice = require('../lib/charge-elements/data-service');
const routing = require('../lib/routing');
/**
 * flowConfig is used to define the
 * -- pageTitle = the title of the page displayed with the form
 * -- nextStep  = the next page to load
 */
const flowConfig = {
  purpose: { pageTitle: 'Select a purpose use', nextStep: 'description' },
  description: { pageTitle: 'Add element description', nextStep: 'abstraction' },
  abstraction: { pageTitle: 'Set abstraction period', nextStep: 'quantities' },
  quantities: { pageTitle: 'Add licence quantities', nextStep: 'time' },
  time: { pageTitle: 'Set time limit?', nextStep: 'source' },
  source: { pageTitle: 'Select source', nextStep: 'season' },
  season: { pageTitle: 'Select season', nextStep: 'loss' },
  loss: { pageTitle: 'Select loss category', nextStep: 'loss' }
};

const getChargeElementStep = async (request, h) => {
  const { step, licenceId } = request.params;
  const sessionData = dataservice.sessionManager(request, licenceId);
  const { defaultCharges, draftChargeInformation, licence } = request.pre;
  return h.view('nunjucks/form', {
    ...request.view,
    caption: `Licence ${licence.licenceNumber}`,
    pageTitle: flowConfig[step].pageTitle,
    back: '/manage',
    form: sessionForms.get(request, forms[step].form(request, sessionData, defaultCharges, draftChargeInformation))
  });
};

const postChargeElementStep = async (request, h) => {
  const { step, licenceId } = request.params;
  const schema = forms[step].schema(request.payload);
  const form = formHelpers.handleRequest(forms[step].form(request), request, schema);
  const { defaultCharges } = request.pre;
  if (form.isValid) {
    const formData = formHelpers.getValues(form);
    // mapp the form data before saving it to the session
    const data = mappers[step] ? mappers[step](formData, defaultCharges) : formData;
    // save the form values in the session except the csrf token
    const sessionData = dataservice.sessionManager(request, licenceId, omit(data, 'csrf_token'));
    if (step === 'loss') {
      dataservice.saveCustomCharge(request, licenceId, sessionData);
      return h.redirect(routing.getCheckData({ id: licenceId }));
    }
    return h.redirect(routing.getChargeElementStep(licenceId, flowConfig[step].nextStep));
  }
  return h.postRedirectGet(form, routing.getChargeElementStep(licenceId, step));
};

exports.getChargeElementStep = getChargeElementStep;
exports.postChargeElementStep = postChargeElementStep;
