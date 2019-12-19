const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const services = require('internal/lib/connectors/services');
const batchService = require('internal/modules/billing/services/batchService');

experiment('internal/modules/billing/services/batchService', () => {
  beforeEach(async () => {
    sandbox.stub(services.water.billingBatches, 'getBatch').resolves();
    sandbox.stub(services.water.regions, 'getRegions').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getBatch', () => {
    beforeEach(async () => {
      services.water.billingBatches.getBatch.resolves({
        data: {
          batchId: 'test-batch-id',
          dateCreated: '2019-12-02',
          batchType: 'supplementary',
          regionId: 'test-region-1'
        } });

      services.water.regions.getRegions.resolves({
        data: [
          { regionId: 'test-region-1', name: 'South East' },
          { regionId: 'test-region-2', name: 'South West' }
        ]
      });
    });

    test('returns object with the batch id', async () => {
      const batch = await batchService.getBatch('test-batch-id');
      expect(batch.id).to.equal('test-batch-id');
    });

    test('returns object with the batch run date', async () => {
      const batch = await batchService.getBatch('test-batch-id');
      expect(batch.billRunDate).to.equal('2019-12-02');
    });

    test('returns object with the region', async () => {
      const batch = await batchService.getBatch('test-batch-id');
      expect(batch.region.name).to.equal('South East');
    });

    test('returns object with the batch type', async () => {
      const batch = await batchService.getBatch('test-batch-id');
      expect(batch.type).to.equal('supplementary');
    });
  });
});
