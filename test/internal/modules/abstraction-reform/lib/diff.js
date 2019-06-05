require('dotenv').config();
const Lab = require('lab');
const { expect } = require('code');

const { diff } = require('../../../../../src/internal/modules/abstraction-reform/lib/diff');

const { experiment, test } = exports.lab = Lab.script();

const baseData = {
  stringField: 'test',
  numberField: 123,
  booleanField: true,
  objectField: {
    foo: 'bar'
  }
};

experiment('Test diff', () => {
  test('It should return null if no change', async () => {
    expect(diff(baseData, baseData)).to.equal(null);
  });

  test('It should detect a change to a string field', async () => {
    const data = {
      ...baseData,
      stringField: 'hello'
    };
    expect(diff(baseData, data)).to.equal({ stringField: data.stringField });
  });

  test('It should detect a change to a numeric field', async () => {
    const data = {
      ...baseData,
      numberField: 123.5
    };
    expect(diff(baseData, data)).to.equal({ numberField: data.numberField });
  });

  test('It should detect a change to an object property', async () => {
    const data = {
      ...baseData,
      objectField: {
        foo: 'boo'
      }
    };
    expect(diff(baseData, data)).to.equal({ objectField: data.objectField });
  });

  test('It should detect the addition of an object property', async () => {
    const data = {
      ...baseData,
      objectField: {
        ...baseData.objectField,
        bar: 'foo'
      }
    };
    expect(diff(baseData, data)).to.equal({ objectField: data.objectField });
  });

  test('It should detect the addition of a new property', async () => {
    const data = {
      ...baseData,
      newField: 'test'
    };
    expect(diff(baseData, data)).to.equal({ newField: 'test' });
  });
});
