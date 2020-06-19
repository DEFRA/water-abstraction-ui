const uuid = require('uuid/v4');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const BillingTransactionsService = require('internal/lib/connectors/services/water/BillingTransactionsService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('services/water/BillingTransactionsService', () => {
  let service;

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'patch');
    service = new BillingTransactionsService('https://example.com/water/1.0');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.updateVolume', () => {
    const transactionId = uuid();

    beforeEach(async () => {
      await service.updateVolume(transactionId, 244.32);
    });

    test('passes the expected URL to the service request', async () => {
      const [url] = serviceRequest.patch.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/billing/transactions/${transactionId}/volume`);
    });

    test('passes the expected payload', async () => {
      const [, { body }] = serviceRequest.patch.lastCall.args;
      expect(body.volume).to.equal(244.32);
    });
  });
});
