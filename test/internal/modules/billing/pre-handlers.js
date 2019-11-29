const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const batchService = require('internal/modules/billing/services/batchService');
const preHandlers = require('internal/modules/billing/pre-handlers');

experiment('internal/modules/billing/pre-handlers', () => {
  beforeEach(async () => {
    sandbox.stub(batchService, 'getBatch').resolves({
      id: 'test-batch-id',
      type: 'annual'
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.loadBatch', () => {
    let request;
    let result;
    let h;

    beforeEach(async () => {
      request = {
        defra: {},
        params: {
          batchId: 'test-batch-id'
        }
      };
      h = { continue: 'continue' };

      result = await preHandlers.loadBatch(request, h);
    });

    test('the batch is added to request.defra', async () => {
      expect(request.defra.batch).to.equal({
        id: 'test-batch-id',
        type: 'annual'
      });
    });

    test('the handler returns h.continue', async () => {
      expect(result).to.equal('continue');
    });
  });
});
