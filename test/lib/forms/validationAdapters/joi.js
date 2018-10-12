const { expect } = require('code');
const { beforeEach, experiment, test } = exports.lab = require('lab').script();
const { applyErrors } = require('../../../../src/lib/forms/validationAdapters/joi');

experiment('applyErrors', () => {
  let resultForm;

  beforeEach(async () => {
    const form = {
      action: '/admin/return/meter/details',
      method: 'POST',
      isSubmitted: true,
      fields: [
        {
          name: 'manufacturer',
          options: {
            label: 'Manufacturer',
            type: 'text',
            errors: {
              'any.required': { message: 'Select a manufacturer' },
              'any.empty': { message: 'Select a manufacturer' }
            }
          },
          errors: []
        },
        {
          name: 'serialNumber',
          options: {
            label: 'Serial number',
            type: 'text',
            errors: {
              'any.required': { message: 'Select a serial number' },
              'any.empty': { message: 'Select a serial number' }
            }
          },
          errors: []
        },
        {
          name: 'startReading',
          options: {
            label: 'Meter start reading',
            type: 'text',
            errors: {
              'number.base': { message: 'Enter a meter start reading' },
              'any.required': { message: 'Enter a meter start reading' },
              'number.positive': { message: 'This number should be positive' }
            }
          },
          errors: []
        },
        {
          name: 'isMultiplier',
          options: { label: 'This meter has a ×10 display', widget: 'checkbox', checked: false },
          errors: [],
          value: 'multiply'
        }
      ],
      errors: [],
      validationType: 'joi'
    };

    const error = {
      isJoi: true,
      name: 'ValidationError',
      details: [
        {
          message: 'manufacturer is not allowed to be empty',
          path: ['manufacturer'],
          type: 'any.empty',
          context: { key: 'manufacturer', label: 'manufacturer' }
        },
        {
          message: 'serialNumber is not allowed to be empty',
          path: ['serialNumber'],
          type: 'any.empty',
          context: {key: 'serialNumber', label: 'serialNumber'}
        },
        {
          message: 'startReading must be a number',
          path: ['startReading'],
          type: 'number.base',
          context: {key: 'startReading', label: 'startReading'}
        }
      ]
    };

    const customErrors = {
      manufacturer: {
        'any.required': { message: 'Select a manufacturer' },
        'any.empty': { message: 'Select a manufacturer' }
      },
      serialNumber: {
        'any.required': { message: 'Select a serial number' },
        'any.empty': { message: 'Select a serial number' }
      },
      startReading: {
        'number.base': { message: 'Enter a meter start reading' },
        'any.required': { message: 'Enter a meter start reading' },
        'number.positive': { message: 'This number should be positive' }
      }
    };

    resultForm = applyErrors(form, error, customErrors);
  });

  test('the form is populated with the expected errors', async () => {
    expect(resultForm.errors).to.equal([
      { name: 'manufacturer', message: 'Select a manufacturer', summary: 'Select a manufacturer' },
      { name: 'serialNumber', message: 'Select a serial number', summary: 'Select a serial number' },
      { name: 'startReading', message: 'Enter a meter start reading', summary: 'Enter a meter start reading' }
    ]);
  });

  test('the manufacturer field is set with the local errors', async () => {
    const manufacturer = resultForm.fields.find(field => field.name === 'manufacturer');
    expect(manufacturer.errors).to.equal([
      { name: 'manufacturer', message: 'Select a manufacturer', summary: 'Select a manufacturer' }
    ]);
  });

  test('the serialNumber field is set with the local errors', async () => {
    const serialNumber = resultForm.fields.find(field => field.name === 'serialNumber');
    expect(serialNumber.errors).to.equal([
      { name: 'serialNumber', message: 'Select a serial number', summary: 'Select a serial number' }
    ]);
  });

  test('the startReading field is set with the local errors', async () => {
    const startReading = resultForm.fields.find(field => field.name === 'startReading');
    expect(startReading.errors).to.equal([
      { name: 'startReading', message: 'Enter a meter start reading', summary: 'Enter a meter start reading' }
    ]);
  });

  test('the isMultiplier field has no errors', async () => {
    const isMultiplier = resultForm.fields.find(field => field.name === 'isMultiplier');
    expect(isMultiplier.errors).to.have.length(0);
  });
});
