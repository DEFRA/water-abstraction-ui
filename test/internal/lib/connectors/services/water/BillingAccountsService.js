const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const BillingAccountsService = require('internal/lib/connectors/services/water/BillingAccountsService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('services/water/BillingAccountsService', () => {
  let service;

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get');
    service = new BillingAccountsService('http://127.0.0.1:8001/water/1.0');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getBillingAccount', () => {
    beforeEach(async () => {
      await service.getBillingAccount('test-billing-account-id');
    });

    test('passes the expected URL to the service request', async () => {
      const expectedUrl = 'http://127.0.0.1:8001/water/1.0/invoice-accounts/test-billing-account-id';
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });
  });
});
