const Joi = require('joi');
const { get } = require('lodash');
const { formFactory, fields, setValues } = require('../../../lib/forms');

const form = (request) => {
  const { csrfToken } = request.view;
  const action = `/admin/return/single-total`;

  const f = formFactory(action);

  f.fields.push(fields.radio('isSingleTotal', {
    label: 'How was this amount provided?',
    mapper: 'booleanMapper',
    choices: [
      { value: true,
        label: 'A single total amount',
        fields: [
          fields.text('total', {label: 'Total amount provided'})
        ]},
      { value: false, label: 'A number of amounts' }
    ]}));

  f.fields.push(fields.button());
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  // Populate state from session
  const data = request.sessionStore.get('internalReturnFlow');
  const isSingleTotal = get(data, 'reading.totalFlag');
  const total = get(data, 'reading.total');

  return setValues(f, { isSingleTotal, total });
};

const schema = {
  isSingleTotal: Joi.boolean().required(),
  total: Joi.when('isSingleTotal', { is: true, then: Joi.number().required() }),
  csrf_token: Joi.string().guid().required()
};

module.exports = {
  singleTotalForm: form,
  singleTotalSchema: schema
};
