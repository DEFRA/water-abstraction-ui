const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const adapter = require('../../../../../src/internal/lib/forms/validationAdapters/json-schema');

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

experiment('formatErrors', async () => {
  const error = {
    errors: [ { keyword: 'required',
      dataPath: '',
      schemaPath: '#/required',
      params: { missingProperty: 'manufacturer' },
      message: 'should have required property \'manufacturer\'' },
    { keyword: 'type',
      dataPath: '.gears',
      schemaPath: '#/properties/gears/type',
      params: { type: 'number' },
      message: 'should be number' } ]
  };

  const customErrors = {
    manufacturer: {
      'required': { message: 'Manufacturer is required', summary: 'There is a problem' }
    }
  };

  test('It should format a required field error', async () => {
    const errors = adapter.formatErrors(error);
    const { message } = error.errors[0];
    expect(errors[0]).to.equal({
      name: 'manufacturer',
      message,
      summary: message
    });
  });

  test('It should format an incorrect type error', async () => {
    const errors = adapter.formatErrors(error);
    const { message } = error.errors[1];
    expect(errors[1]).to.equal({
      name: 'gears',
      message,
      summary: message
    });
  });

  test('It should format an error with custom errors if available', async () => {
    const errors = adapter.formatErrors(error, customErrors);
    const { message, summary } = customErrors.manufacturer.required;
    expect(errors[0]).to.equal({
      name: 'manufacturer',
      message,
      summary
    });
  });
});

const nestedSchema = {
  properties: {
    name: {
      type: 'object',
      properties: {
        firstName: {
          type: 'string'
        },
        lastName: {
          type: 'string'
        }
      }
    },
    age: {
      type: 'number'
    }
  }
};

experiment('getPathMap', async () => {
  test('It should create a map of property names to their positions in the object heirarchy', async () => {
    const map = adapter.getPathMap(nestedSchema);
    expect(map).to.equal({
      age: 'age',
      firstName: 'name.firstName',
      lastName: 'name.lastName'
    });
  });
});

experiment('mapValue', async () => {
  test('It should convert an empty string to undefined', async () => {
    expect(adapter.mapValue('')).to.equal(undefined);
  });

  test('It should convert null to undefined', async () => {
    expect(adapter.mapValue(null)).to.equal(undefined);
  });

  test('It should pass through non-empty strings or other types unchanged', async () => {
    expect(adapter.mapValue('Hello')).to.equal('Hello');
    expect(adapter.mapValue(123)).to.equal(123);
    expect(adapter.mapValue(undefined)).to.equal(undefined);
  });
});

experiment('mapRequestData', async () => {
  test('It should map an HTTP request to an object for validation with JSON schema', async () => {
    const result = adapter.mapRequestData({
      age: 25,
      firstName: 'John',
      lastName: ''
    }, nestedSchema);
    expect(result).to.equal({
      age: 25,
      name: {
        firstName: 'John',
        lastName: undefined
      }
    });
  });
});
