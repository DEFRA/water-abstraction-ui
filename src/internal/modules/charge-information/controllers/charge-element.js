'use-strict';

const sessionForms = require('shared/lib/session-forms');
const formHelpers = require('shared/lib/forms');
const dataService = require('../lib/charge-elements/data-service');
const forms = require('../forms/charge-element/index');
const urlJoin = require('url-join');
const { omit } = require('lodash');
const mappers = require('../lib/charge-elements/mappers');
const moment = require('moment');

const steps = {
  purpose: { title: 'Select a purpose use', nextStep: 'description', formValues: ['purpose'] },
  description: { title: 'Add element description', nextStep: 'abstraction' },
  abstraction: { title: 'Set abstraction period', nextStep: 'quantities', mapper: mappers.mapAbstractionPeriod },
  quantities: { title: 'Add licence quantities', nextStep: 'time' },
  time: { title: 'Set time limit?', nextStep: 'source', mapper: mappers.mapTimeLimit },
  source: { title: 'Select source', nextStep: 'season' },
  season: { title: 'Select season', nextStep: 'loss' },
  loss: { title: 'Select loss category', nextStep: 'end' }
};

const getChargeElementStep = async (request, h) => {
  const { step, licenceId, elementId } = request.params;
  const sessionData = dataService.sessionManager(request, licenceId, elementId);
  const defaultChargeData = request.pre.defaultCharges;

  return h.view('nunjucks/form', {
    ...request.view,
    caption: 'licenceNumber',
    pageTitle: steps[step].title,
    back: '/manage',
    form: sessionForms.get(request, forms[step].form(request, sessionData, defaultChargeData))
  });
};

const validateDates = (key, value) => {
  const dateValue = `2000-${value}`;
  if (!(moment(dateValue, 'YYYY-MM-DD', true).isValid())) {
    return {
      name: `${key}Date`,
      message: `Enter a valid ${key} day and month`,
      summary: `Enter a valid ${key} day and month`
    };
  }
  return null;
};

const postChargeElementStep = async (request, h) => {
  const { step, licenceId, elementId } = request.params;
  const schema = forms[step].schema(request.payload);
  const form = formHelpers.handleRequest(forms[step].form(request), request, schema);
  if (step === 'abstraction1') {
    const formData = formHelpers.getValues(form);
    const start = validateDates('start', formData.startDate);
    const end = validateDates('end', formData.endDate);
    if (start) {
      form.errors.push(start);
      form.isValid = false;
    };
    if (end) {
      form.errors.push(end);
      form.isValid = false;
    };
  };
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
