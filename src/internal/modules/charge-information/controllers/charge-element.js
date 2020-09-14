'use-strict';

const sessionForms = require('shared/lib/session-forms');
const formHelpers = require('shared/lib/forms');
const dataService = require('../lib/charge-elements/data-service');
const forms = require('../forms/charge-element/index');
const urlJoin = require('url-join');
const { omit } = require('lodash');
const mappers = require('../lib/charge-elements/mappers');

const steps = {
  purpose: { title: 'Select a purpose use', nextStep: 'description', formValues: ['purpose'] },
  description: { title: 'Add element description', nextStep: 'period' },
  period: { title: 'Set abstraction period', nextStep: 'quantities', mapper: mappers.mapAbstractionPeriod },
  quantities: { title: 'Add licence quantities', nextStep: 'time' },
  time: { title: 'Set time limit?', nextStep: 'source', mapper: mappers.mapTimeLimit },
  source: { title: 'Select source', nextStep: 'season' },
  season: { title: 'Select season', nextStep: 'loss' },
  loss: { title: 'Select loss category', nextStep: 'end' }
};

const getChargeElementStep = async (request, h) => {
  const { step, licenceId, elementId } = request.params;
  const sessionData = dataService.sessionManager(request, licenceId, elementId);
  return h.view('nunjucks/form', {
    ...request.view,
    caption: 'licenceNumber',
    pageTitle: steps[step].title,
    back: '/manage',
    form: sessionForms.get(request, forms[step].form(request, sessionData))
  });
};

const postChargeElementStep = async (request, h) => {
  const { step, licenceId, elementId } = request.params;
  const schema = forms[step].schema(request.payload);
  const form = formHelpers.handleRequest(forms[step].form(request), request, schema);
  if (form.isValid) {
    const formData = formHelpers.getValues(form);
    // save the form values in the session except the csrf token
    const data = steps[step].mapper ? steps[step].mapper(formData) : formData;
    dataService.sessionManager(request, licenceId, elementId, omit(data, 'csrf_token'));
    return h.redirect(urlJoin('/licences/', licenceId, 'charge-information/charge-element', elementId, steps[step].nextStep));
  }
  return h.postRedirectGet(form, urlJoin('/licences/', licenceId, 'charge-information/charge-element', elementId, step));
};

exports.getChargeElementStep = getChargeElementStep;
exports.postChargeElementStep = postChargeElementStep;
