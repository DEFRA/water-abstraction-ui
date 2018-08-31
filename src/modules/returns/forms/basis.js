const Joi = require('joi');
const { get } = require('lodash');
const { formFactory, fields, setValues } = require('../../../lib/forms');

/**
 * Maps data in model to basis form
 * @param {Object} data - returns model data
 * @return {Object} form values
 */
const mapModelToForm = (data) => {
  const readingType = get(data, 'reading.type');
  const readingMethod = get(data, 'reading.method');

  if (readingType === 'measured') {
    return {
      basis: 'records',
      pumpCapacity: null,
      hoursRun: null,
      numberLivestock: null
    };
  } else if (readingMethod === 'pump') {
    return {
      basis: 'pump',
      pumpCapacity: get(data, 'reading.pumpCapacity'),
      hoursRun: get(data, 'reading.hoursRun'),
      numberLivestock: null
    };
  } else if (readingMethod === 'livestock') {
    return {
      basis: 'herd',
      pumpCapacity: null,
      hoursRun: null,
      numberLivestock: get(data, 'reading.numberLivestock')
    };
  }
  return {};
};

const form = (request) => {
  const { csrfToken } = request.view;
  const action = `/admin/return/basis`;

  const f = formFactory(action);

  f.fields.push(fields.radio('basis', {
    label: 'What is your return total based on?',
    choices: [
      { value: 'records',
        label: 'Records'
      },
      {
        value: 'pump',
        label: 'Abstraction rate',
        fields: [
          fields.text('pumpCapacity', {label: 'Pump capacity', panel: true, jsHidden: true}),
          fields.text('hoursRun', {label: 'Hours run', panel: true, jsHidden: true})
        ]
      },
      {
        value: 'herd',
        label: 'Herd numbers',
        fields: [
          fields.text('numberLivestock', {label: 'Number of head of livestock', panel: true, jsHidden: true})
        ]
      }

    ]}));

  f.fields.push(fields.button());
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  // Populate state from session
  const data = request.sessionStore.get('internalReturnFlow');
  const values = mapModelToForm(data);

  return setValues(f, values);
};

const schema = {
  basis: Joi.string().required().valid('records', 'pump', 'herd'),
  pumpCapacity: Joi.when('basis', { is: 'pump', then: Joi.number().required() }),
  hoursRun: Joi.when('basis', { is: 'pump', then: Joi.number().required() }),
  numberLivestock: Joi.when('basis', { is: 'herd', then: Joi.number().required().min(1) }),
  csrf_token: Joi.string().guid().required()
};

module.exports = {
  basisForm: form,
  basisSchema: schema
};
