'use strict';

const { formFactory, fields } = require('shared/lib/forms');

const confirmForm = request => {
  const { csrfToken } = request.view;
  const f = formFactory(request.path, 'POST');
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Submit' }));
  return f;
};

exports.form = confirmForm;
