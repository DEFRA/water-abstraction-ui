const { formFactory, fields } = require('shared/lib/forms/');
const Joi = require('@hapi/joi');

/**
 * Creates an object to represent the form for capturing the

 *
 * @param {Object} request The Hapi request object
 * @param {string} billRunType The type of bill run selected
  */
const viewBillRunListForm = (request) => {
  const action = '/billing/batch/type';
  const { csrfToken } = request.view;
  const f = formFactory(action, 'GET');
  f.fields.push(fields.button(null, { label: 'Create a bill run' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  return f;
};

const viewBillRunListFormSchema = {
  csrf_token: Joi.string().uuid().required()
};

exports.viewBillRunListFormSchema = viewBillRunListFormSchema;
exports.viewBillRunListForm = viewBillRunListForm;
