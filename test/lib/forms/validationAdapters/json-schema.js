const { expect } = require('code');
const { beforeEach, experiment, test } = exports.lab = require('lab').script();

const adapter = require('../../../../src/lib/forms/validationAdapters/json-schema');

experiment('validate', () => {
  const shallowSchema = {
    $id: 'http://test.com/bike.schema.json',
    type: 'object',
    properties: {
      colour: {
        type: 'string'
      }
    },
    required: [ 'colour' ]
  };

  test('for a schema and valid data, error is false', async () => {
    const bike = { colour: 'blue' };
    const result = adapter.validate(bike, shallowSchema);
    expect(result.error).to.be.false();
  });

  test('for a schema and valid data, value is the data', async () => {
    const bike = { colour: 'blue' };
    const result = adapter.validate(bike, shallowSchema);
    expect(result.value).to.equal(bike);
  });

  test('for a schema and invalid data, error is an object', async () => {
    const bike = { gears: 7 };
    const result = adapter.validate(bike, shallowSchema);
    expect(result.error).to.be.an.object();
  });

  test('for a schema and invalid data, value is the data', async () => {
    const bike = { gears: 7 };
    const result = adapter.validate(bike, shallowSchema);
    expect(result.value).to.equal(bike);
  });
});

experiment('createSchemaFromForm', () => {
  // forms are generated from a JSON schema, so in this adapter the interface
  // is a bit broken. Expecting an error to provent forms generating schemas.
  test('throws an imlementation error because it should not be required', async () => {
    expect(() => {
      adapter.createSchemaFromForm({});
    }).to.throw();
  });
});

experiment('formatErrors', () => {
  let customErrors;
  let formattedErrors;

  beforeEach(async () => {
    const validatorResult = {
      error: {
        instance: {},
        propertyPath: 'instance',
        errors: [
          {
            property: 'instance',
            message: 'requires property "manufacturer"',
            instance: {},
            name: 'required',
            argument: 'manufacturer',
            stack: 'instance requires property "manufacturer"'
          },
          {
            property: 'instance',
            message: 'requires property "serialNumber"',
            instance: {},
            name: 'required',
            argument: 'serialNumber',
            stack: 'instance requires property "serialNumber"'
          },
          {
            property: 'instance',
            message: 'requires property "startReading"',
            instance: {},
            name: 'required',
            argument: 'startReading',
            stack: 'instance requires property "startReading"'
          }
        ],
        disableFormat: false
      },
      value: {}
    };

    const customErrors = {
      manufacturer: {
        'required': {
          message: 'Select a manufacturer',
          summary: 'Custom summary'
        }
      },
      serialNumber: {
        'required': { message: 'Select a serial number' }
      }
    };

    formattedErrors = adapter.formatErrors(validatorResult.error, customErrors);
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

  test('uses the default JSON schema errors for the startReading because no custom values specified', async () => {
    const manufacturerError = formattedErrors.find(error => error.name === 'startReading');
    expect(manufacturerError).to.equal({
      message: 'requires property "startReading"',
      name: 'startReading',
      summary: 'requires property "startReading"'
    });
  });

  test('the isMultiplier field has no errors', async () => {
    const isMultiplier = formattedErrors.find(field => field.name === 'isMultiplier');
    expect(isMultiplier).to.not.exist();
  });

  test('returns an empty array when no errors', async () => {
    const validatorResult = {
      instance: {},
      schema: { type: 'object', properties: { one: [Object] } },
      propertyPath: 'instance',
      errors: [],
      throwError: undefined,
      disableFormat: false
    };
    const formatted = adapter.formatErrors(validatorResult, customErrors);
    expect(formatted).to.equal([]);
  });
});
