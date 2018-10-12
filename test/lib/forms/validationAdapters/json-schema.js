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
            errors: { 'required': { message: 'Select a manufacturer' } }
          },
          errors: []
        },
        {
          name: 'serialNumber',
          options: {
            label: 'Serial number',
            type: 'text',
            errors: { 'required': { message: 'Select a serial number' } }
          },
          errors: []
        },
        {
          name: 'startReading',
          options: {
            label: 'Meter start reading',
            type: 'text',
            errors: {
              'required': { message: 'Enter a meter start reading' },
              'minimum': { message: 'This number should be positive' }
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
      validationType: 'json'
    };

    const validationResult = {
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
        'required': { message: 'Select a manufacturer' }
      },
      serialNumber: {
        'required': { message: 'Select a serial number' }
      },
      startReading: {
        'required': { message: 'Enter a meter start reading' },
        'minimum': { message: 'This number should be positive' }
      }
    };

    resultForm = adapter.applyErrors(form, validationResult.error, customErrors);
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
