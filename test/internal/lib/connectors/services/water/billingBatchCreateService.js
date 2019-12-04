const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const BillingBatchCreateService = require('internal/lib/connectors/services/water/BillingBatchCreateService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('services/water/billingBatchCreateService', () => {
  let service;

  const batch = {
    'userEmail': 'userEmail@testmail.com',
    'regionId': 'selectedBillingRegion',
    'batchType': 'annual',
    'financialYear': new Date().getFullYear(),
    'season': 'summer' // ('summer', 'winter', 'all year').required();
  };

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'post');
    sandbox.stub(serviceRequest, 'get');
    service = new BillingBatchCreateService('http://127.0.0.1:8001/water/1.0');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.createBillingBatch', () => {
    test('passes the expected URL to the service request', async () => {
      await service.createBillingBatch(batch);
      const expectedUrl = 'http://127.0.0.1:8001/water/1.0/billing/batches';
      const [url] = serviceRequest.post.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });
    test('passes the expected body to the service request', async () => {
      await service.createBillingBatch(batch);
      const [ , { body } ] = serviceRequest.post.lastCall.args;
      expect(body).to.equal(batch);
    });
  });
});
