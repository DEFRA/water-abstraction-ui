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
    sandbox.stub(services.water.billingBatches, 'getBatches').resolves();
    sandbox.stub(services.water.billingBatches, 'getBatchInvoices').resolves();
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
      expect(batch.region.id).to.equal('test-region-1');
    });

    test('returns object with the batch type', async () => {
      const batch = await batchService.getBatch('test-batch-id');
      expect(batch.type).to.equal('supplementary');
    });
  });

  experiment('.getBatchList', () => {
    let result;

    beforeEach(async () => {
      services.water.billingBatches.getBatches.resolves([{ id: 'test' }]);
      result = await batchService.getBatchList(1, 10);
    });

    test('returns the expected result from the data layer', async () => {
      expect(result).to.equal([{ id: 'test' }]);
    });

    test('passes the pagination params on', async () => {
      const [page, perPage] = services.water.billingBatches.getBatches.lastCall.args;
      expect(page).to.equal(1);
      expect(perPage).to.equal(10);
    });
  });

  experiment('.getBatchInvoices', () => {
    beforeEach(async () => {
      services.water.billingBatches.getBatch.resolves({
        data: {
          batchId: 'test-batch-id',
          dateCreated: '2019-12-02',
          batchType: 'supplementary',
          regionId: 'test-region-1'
        } });

      services.water.billingBatches.getBatchInvoices.resolves({
        data: [
          {
            id: 'test-invoice-1',
            totals: {
              totalValue: 1,
              totalInvoices: 1,
              totalCredits: 1,
              numberOfInvoices: 1,
              numberOfCredits: 1
            }
          },
          {
            id: 'test-invoice-2',
            totals: {
              totalValue: -2,
              totalInvoices: 3,
              totalCredits: 5,
              numberOfInvoices: 2,
              numberOfCredits: 4
            }
          }
        ]
      });

      services.water.regions.getRegions.resolves({
        data: [
          { regionId: 'test-region-1', name: 'South East' },
          { regionId: 'test-region-2', name: 'South West' }
        ]
      });
    });

    test('return an object contain the batch', async () => {
      const { batch } = await batchService.getBatchInvoices('test-batch-id');
      expect(batch.region.name).to.equal('South East');
      expect(batch.billRunDate).to.equal('2019-12-02');
      expect(batch.type).to.equal('supplementary');
    });

    test('return an object contain the the invoices', async () => {
      const { invoices } = await batchService.getBatchInvoices('test-batch-id');
      expect(invoices[0].id).to.equal('test-invoice-1');
      expect(invoices[1].id).to.equal('test-invoice-2');
    });

    test('returns an object containing the totals of all the invoices', async () => {
      const { totals } = await batchService.getBatchInvoices('test-batch-id');
      expect(totals.totalValue).to.equal(1 + -2);
      expect(totals.totalInvoices).to.equal(1 + 3);
      expect(totals.totalCredits).to.equal(1 + 5);
      expect(totals.numberOfInvoices).to.equal(1 + 2);
      expect(totals.numberOfCredits).to.equal(1 + 4);
    });
  });
});
