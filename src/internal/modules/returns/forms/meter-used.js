const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms');
const { getPath } = require('../lib/flow-helpers');
const { STEP_METER_USED } = require('../lib/flow-helpers');
const { get } = require('lodash');

const mapValue = data => {
  const value = get(data, 'reading.type');
  if (value === 'measured') {
    return true;
  }
  if (value === 'estimated') {
    return false;
  }
};

const form = (request, data = {}) => {
  const { csrfToken } = request.view;

  const action = getPath(STEP_METER_USED, request);

  const f = formFactory(action);

  f.fields.push(fields.radio('meterUsed', {
    mapper: 'booleanMapper',
    label: 'Did they use a meter or meters?',
    errors: {
      'any.required': {
        message: 'Select if a meter or meters were used'
      }
    },
    choices: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  }, mapValue(data)));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

const schema = {
  meterUsed: Joi.boolean().required(),
  csrf_token: Joi.string().guid().required()
};

exports.meterUsedForm = form;
exports.meterUsedSchema = schema;
