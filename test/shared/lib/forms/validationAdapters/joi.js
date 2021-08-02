const { expect } = require('@hapi/code');
const { beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script();
const adapter = require('shared/lib/forms/validationAdapters/joi');

experiment('formatErrors', () => {
  let error;
  let customErrors;
  let formattedErrors;

  beforeEach(async () => {
    error = {
      isJoi: true,
      name: 'ValidationError',
      details: [
        {
          message: 'manufacturer is not allowed to be empty',
          path: ['manufacturer'],
          type: 'string.empty',
          context: { key: 'manufacturer', label: 'manufacturer' }
        },
        {
          message: 'serialNumber is not allowed to be empty',
          path: ['serialNumber'],
          type: 'string.empty',
          context: { key: 'serialNumber', label: 'serialNumber' }
        },
        {
          message: 'startReading must be a number',
          path: ['startReading'],
          type: 'number.base',
          context: { key: 'startReading', label: 'startReading' }
        }
      ]
    };

    customErrors = {
      manufacturer: {
        'any.required': { message: 'Select a manufacturer' },
        'string.empty': { message: 'Select a manufacturer', summary: 'Custom summary' }
      },
      serialNumber: {
        'any.required': { message: 'Select a serial number' },
        'string.empty': { message: 'Select a serial number' }
      }
    };

    formattedErrors = adapter.formatErrors(error, customErrors);
  });

  test('formats the manufacturer errors as expected', async () => {
    const manufacturerError = formattedErrors.find(error => error.name === 'manufacturer');
    expect(manufacturerError).to.equal({
      message: 'Select a manufacturer',
      name: 'manufacturer',
      summary: 'Custom summary'
    });
  });

  test('formats the serialNumber errors as expected', async () => {
    const manufacturerError = formattedErrors.find(error => error.name === 'serialNumber');
    expect(manufacturerError).to.equal({
      message: 'Select a serial number',
      name: 'serialNumber',
      summary: 'Select a serial number'
    });
  });

  test('uses the default Joi errors for the startReading because no custom values specified', async () => {
    const manufacturerError = formattedErrors.find(error => error.name === 'startReading');
    expect(manufacturerError).to.equal({
      message: 'startReading must be a number',
      name: 'startReading',
      summary: 'startReading must be a number'
    });
  });

  test('returns an empty array for a null error object (no errors)', async () => {
    const formatted = adapter.formatErrors(null, customErrors);
    expect(formatted).to.equal([]);
  });
});
