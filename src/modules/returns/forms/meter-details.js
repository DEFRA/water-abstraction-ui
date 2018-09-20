const Joi = require('joi');
const { formFactory, fields, setValues } = require('../../../lib/forms');
const { getMeter } = require('../lib/return-helpers');

const getError = message => ({ summary: message, message });

const form = (request, data) => {
  const { csrfToken } = request.view;

  const isInternal = request.permissions.hasPermission('admin.defra');
  const action = `${isInternal ? '/admin' : ''}/return/meter/details`;

  const f = formFactory(action);
  const meter = getMeter(data);

  f.fields.push(fields.text('manufacturer', {
    label: 'Manufacturer',
    errors: {
      'any.required': getError('Select a manufacturer'),
      'any.empty': getError('Select a manufacturer')
    }
  }, ''));

  f.fields.push(fields.text('serialNumber', {
    label: 'Serial number',
    errors: {
      'any.required': getError('Select a serial number'),
      'any.empty': getError('Select a serial number')
    }
  }, ''));

  f.fields.push(fields.text('startReading', {
    label: 'Meter start reading',
    errors: {
      'number.base': getError('Enter a meter start reading'),
      'any.required': getError('Enter a meter start reading'),
      'number.positive': getError('This number should be positive')
    }
  }, ''));

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
