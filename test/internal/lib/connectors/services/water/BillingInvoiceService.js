const { v4: uuid } = require('uuid');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const BillingInvoiceService = require('internal/lib/connectors/services/water/BillingInvoiceService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('services/water/BillingInvoiceService', () => {
  let service;

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'patch');
    service = new BillingInvoiceService('https://example.com/water/1.0');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.patchFlagForRebilling', () => {
    test('passes the expected URL to the service request', async () => {
      const invoiceId = uuid();
      await service.patchFlagForRebilling(invoiceId, true);
      const [url, options] = serviceRequest.patch.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/billing/invoices/${invoiceId}`);
      expect(options.body.isFlaggedForRebilling).to.be.true();
    });
  });
});
