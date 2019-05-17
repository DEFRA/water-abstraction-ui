require('dotenv').config();

const {
  mapConditionText
} = require('../../../../../src/external/modules/abstraction-reform/lib/map-condition');
const { expect } = require('code');

const { experiment, test } = exports.lab = require('lab').script();

experiment('Test mapConditionText', () => {
  test('It should generate text for a condition', async () => {
    const condition = {
      id: 'nald://conditions/6/123456',
      code: 'CES',
      subCode: 'FLOW'
    };
    const text = mapConditionText(condition);
    expect(text).to.equal(`123456: Flow cessation condition`);
  });
});
