const Joi = require('joi');
const { formFactory, fields, setValues } = require('../../../lib/forms');
const { getMeter } = require('../lib/return-helpers');

const textFieldManufacturer = fields.text('manufacturer', {
  label: 'Manufacturer',
  errors: {
    'any.required': { message: 'Select a manufacturer' },
    'any.empty': { message: 'Select a manufacturer' }
  }
});

const textFieldSerialNumber = fields.text('serialNumber', {
  label: 'Serial number',
  errors: {
    'any.required': { message: 'Select a serial number' },
    'any.empty': { message: 'Select a serial number' }
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

const form = (request, data) => {
  const { csrfToken } = request.view;

  const isInternal = request.permissions.hasPermission('admin.defra');
  const action = `${isInternal ? '/admin' : ''}/return/meter/details`;

  const f = formFactory(action);
  const meter = getMeter(data);

  f.fields.push(textFieldManufacturer);
  f.fields.push(textFieldSerialNumber);
  f.fields.push(textFieldStartReading);

  f.fields.push(fields.checkbox('isMultiplier', {
    label: 'This meter has a ×10 display',
    checked: meter.multiplier === 10
  }, 'multiply'));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return setValues(f, meter);
};

const schema = {
  manufacturer: Joi.string().required(),
  serialNumber: Joi.string().required(),
  startReading: Joi.number().positive().required(),
  isMultiplier: Joi.boolean().truthy('multiply').falsy('').optional(),
  csrf_token: Joi.string().guid().required()
};

module.exports = {
  meterDetailsForm: form,
  meterDetailsSchema: schema
};
