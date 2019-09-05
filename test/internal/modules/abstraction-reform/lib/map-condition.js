require('dotenv').config();

const {
  mapConditionText
} = require('internal/modules/abstraction-reform/lib/map-condition');
const { expect } = require('@hapi/code');

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { logger } = require('internal/logger');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

experiment('.mapConditionText', () => {
  beforeEach(async () => {
    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('It should generate text for a condition', async () => {
    const condition = {
      id: 'nald://conditions/6/123456',
      code: 'CES',
      subCode: 'FLOW'
    };
    const text = mapConditionText(condition);
    expect(text).to.equal(`123456: Flow cessation condition`);
  });

  test('logs an error if the condition title is not found', async () => {
    const condition = {
      id: 'nald://conditions/6/123456',
      code: 'NOT_A_REAL_CODE',
      subCode: 'NOT_A_REAL_SUB_CODE'
    };

    expect(() => mapConditionText(condition)).to.throw();
    const [message, error, params] = logger.error.lastCall.args;

    expect(message).to.equal('Could not find condition title');
    expect(error).to.be.an.error();
    expect(params).to.equal(condition);
  });
});
