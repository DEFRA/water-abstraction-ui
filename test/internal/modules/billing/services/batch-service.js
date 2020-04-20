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
});
