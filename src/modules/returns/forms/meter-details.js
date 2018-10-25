const Joi = require('joi');
const { get } = require('lodash');
const { formFactory, fields, setValues } = require('../../../lib/forms');
const { getMeter } = require('../lib/return-helpers');
const { STEP_METER_DETAILS, getPath } = require('../lib/flow-helpers');

const textFieldManufacturer = fields.text('manufacturer', {
  label: 'Manufacturer',
  errors: {
    'any.required': { message: 'Enter a manufacturer' },
    'any.empty': { message: 'Enter a manufacturer' }
  }
});

const textFieldSerialNumber = fields.text('serialNumber', {
  label: 'Serial number',
  errors: {
    'any.required': { message: 'Enter a serial number' },
    'any.empty': { message: 'Enter a serial number' }
  }
});

const textFieldStartReading = fields.text('startReading', {
  label: 'Meter start reading',
  errors: {
    'number.base': { message: 'Enter a meter start reading' },
    'any.required': { message: 'Enter a meter start reading' },
    'number.positive': { message: 'This number should be positive' }
  }
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

  if (isVolumes) {
    f.fields.push(introText);
  }

  f.fields.push(textFieldManufacturer);
  f.fields.push(textFieldSerialNumber);

  if (!isVolumes) {
    f.fields.push(textFieldStartReading);
  }

  f.fields.push(fields.checkbox('isMultiplier', {
    label: 'This meter has a ×10 display',
    checked: meter.multiplier === 10
  }, 'multiply'));

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
  const isVolumes = get(data, 'reading.method') === 'abstractionVolumes';

  const schema = {
    manufacturer: Joi.string().required(),
    serialNumber: Joi.string().required(),
    isMultiplier: Joi.boolean().truthy('multiply').falsy('').optional(),
    csrf_token: Joi.string().guid().required()
  };

  if (!isVolumes) {
    schema.startReading = Joi.number().positive().required();
  }

  return schema;
};

module.exports = {
  meterDetailsForm: form,
  meterDetailsSchema
};
