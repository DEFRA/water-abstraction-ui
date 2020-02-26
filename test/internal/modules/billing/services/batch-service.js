'use strict';

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
const batchService = require('internal/modules/billing/services/batch-service');

const data = {
  batch: {
    id: 'test-batch-id',
    dateCreated: '2019-12-02',
    type: 'supplementary',
    region: {
      id: 'test-region-1',
      name: 'Anglian',
      code: 'A'
    }
  },
  invoices: [
    {
      'id': '4abf7d0a-6148-4781-8c6a-7a8b9267b4a9',
      'accountNumber': 'A12345678A',
      'name': 'Test company 1',
      'netTotal': 12345,
      'licenceNumbers': [
        '01/123/A'
      ]
    },
    {
      'id': '9a806cbb-f1b9-49ae-b551-98affa2d2b9b',
      'accountNumber': 'A89765432A',
      'name': 'Test company 2',
      'netTotal': 675467,
      'licenceNumbers': [
        '04/567/B'
      ]
    }]
};

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
    let result;

    beforeEach(async () => {
      services.water.billingBatches.getBatch.resolves(data.batch);
      services.water.billingBatches.getBatchInvoices.resolves(data.invoices);
      result = await batchService.getBatchInvoices('test-batch-id');
    });

    test('calls the batches data service with correct params', async () => {
      const [batchId, isWithTotals] = services.water.billingBatches.getBatch.lastCall.args;
      expect(batchId).to.equal('test-batch-id');
      expect(isWithTotals).to.be.true();
    });

    test('calls the invoices data service with correct params', async () => {
      const [batchId] = services.water.billingBatches.getBatchInvoices.lastCall.args;
      expect(batchId).to.equal('test-batch-id');
    });

    test('resolves with the batch and invoices data', async () => {
      expect(result.batch).to.equal(data.batch);
      expect(result.invoices).to.equal(data.invoices);
    });
  });
});
