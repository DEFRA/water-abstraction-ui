'use strict';

const { formFactory, fields } = require('shared/lib/forms/');
const routing = require('../lib/routing');

const cancelChargeInformationForm = request => {
  const { csrfToken } = request.view;

  const action = routing.getCancelData(request.params.licenceId);
  const f = formFactory(action, 'POST');

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Cancel' }));

  return f;
};

exports.form = cancelChargeInformationForm;
