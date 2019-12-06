const { formFactory, fields } = require('shared/lib/forms/');
const Joi = require('@hapi/joi');

const batchListForm = (request) => {
  const action = '/billing/batch/type';
  const { csrfToken } = request.view;
  const f = formFactory(action, 'GET');
  f.fields.push(fields.button(null, { label: 'Create a bill run' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  return f;
};

const batchListFormSchema = {
  csrf_token: Joi.string().uuid().required()
};

exports.batchListFormSchema = batchListFormSchema;
exports.batchListForm = batchListForm;
