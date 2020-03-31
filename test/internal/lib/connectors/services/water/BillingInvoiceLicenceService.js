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

const BillingInvoiceLicenceService = require('internal/lib/connectors/services/water/BillingInvoiceLicenceService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('services/water/BillingInvoiceLicenceService', () => {
  let service;

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get');
    service = new BillingInvoiceLicenceService('https://example.com/water/1.0');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getInvoiceLicence', () => {
    test('passes the expected URL to the service request', async () => {
      const invoiceLicenceId = uuid();
      await service.getInvoiceLicence(invoiceLicenceId);
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/billing/invoice-licences/${invoiceLicenceId}`);
    });
  });
});
