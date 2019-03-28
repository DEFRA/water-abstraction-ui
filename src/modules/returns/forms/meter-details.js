const Joi = require('joi');
const { get } = require('lodash');
const { formFactory, fields, setValues } = require('../../../lib/forms');
const { getMeter } = require('../lib/return-helpers');
const { STEP_METER_DETAILS, getPath } = require('../lib/flow-helpers');

const textFieldManufacturer = fields.text('manufacturer', {
  label: 'Make',
  controlClass: 'govuk-!-width-one-quarter',
  errors: {
    'any.required': { message: 'Enter the make of your meter' },
    'any.empty': { message: 'Enter the make of your meter' }
  }
});

const textFieldSerialNumber = fields.text('serialNumber', {
  label: 'Serial number',
  controlClass: 'govuk-!-width-one-quarter',
  errors: {
    'any.required': { message: 'Enter a serial number' },
    'any.empty': { message: 'Enter a serial number' }
  }
});

const pageHeading = fields.paragraph(null, {
  text: 'Tell us about your meter',
  element: 'h3',
  controlClass: 'govuk-heading-m'
});

const introText = fields.paragraph(null, {
  text: 'You only need to tell us about one meter.'
});

const form = (request, data) => {
  const isVolumes = get(data, 'reading.method') === 'abstractionVolumes';

  const { csrfToken } = request.view;

  const action = getPath(STEP_METER_DETAILS, request);

  const f = formFactory(action);
  const meter = getMeter(data);

  f.fields.push(pageHeading);

  if (isVolumes) {
    f.fields.push(introText);
  }

  f.fields.push(textFieldManufacturer);
  f.fields.push(textFieldSerialNumber);

  // Checkbox internal type is array
  const checked = meter.multiplier === 10 ? ['multiply'] : [];

  f.fields.push(fields.checkbox('isMultiplier', {
    choices: [{
      label: 'This meter has a ×10 display',
      value: 'multiply'
    }]
  }, checked));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return setValues(f, meter);
};

/**
 * Gets Joi the schema for the meter details form
 * @param {Object} data - return data model
 * @return {Object} Joi schema
 */
const meterDetailsSchema = (data) => {
  const schema = {
    manufacturer: Joi.string().required(),
    serialNumber: Joi.string().required(),
    isMultiplier: Joi.array().items(Joi.string().valid('multiply')),
    csrf_token: Joi.string().guid().required()
  };

  return schema;
};

module.exports = {
  meterDetailsForm: form,
  meterDetailsSchema
};
