const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const BillingBatchService = require('internal/lib/connectors/services/water/BillingBatchService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

const batchId = 'batchId0-9427-47dd-9034-e8c7e218c806';

experiment('services/water/BillingBatchService', async () => {
  let service;

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get');
    service = new BillingBatchService('http://127.0.0.1:8001/water/1.0');
  });

  afterEach(async () => sandbox.restore());

  experiment('.getBatch', async () => {
    test('passes the expected URL to the service request', async () => {
      await service.getBatch(batchId);
      const expectedUrl = `http://127.0.0.1:8001/water/1.0/billing/batches/${batchId}`;
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });
  });

  experiment('.getInvoicesForBatch', async () => {
    test('passes the expected URL to the service request', async () => {
      await service.getInvoicesForBatch(batchId);
      const expectedUrl = `http://127.0.0.1:8001/water/1.0/billing/batches/${batchId}/invoices`;
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });
  });
});
