const Joi = require('joi');
const { get } = require('lodash');
const { formFactory, fields, setValues } = require('shared/lib/forms');
const { getPath } = require('../lib/flow-helpers');
const { STEP_METER_DETAILS_PROVIDED } = require('../lib/flow-helpers');

const form = (request, data = {}) => {
  const { csrfToken } = request.view;

  const action = getPath(STEP_METER_DETAILS_PROVIDED, request);

  const f = formFactory(action);

  f.fields.push(fields.radio('meterDetailsProvided', {
    mapper: 'booleanMapper',
    label: 'Have meter details been provided?',
    errors: {
      'any.required': {
        message: 'Select if meter details have been provided'
      }
    },
    choices: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  }));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  const firstMeter = get(data, 'meters[0]', {});
  return setValues(f, firstMeter);
};

const schema = {
  meterDetailsProvided: Joi.boolean().required(),
  csrf_token: Joi.string().guid().required()
};

exports.meterDetailsProvidedForm = form;
exports.meterDetailsProvidedSchema = schema;
