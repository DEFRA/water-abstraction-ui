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

const InvoiceAccountService = require('internal/lib/connectors/services/water/InvoiceAccountService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('services/water/InvoiceAccountService', () => {
  let service;

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get');

    service = new InvoiceAccountService('https://example.com/water/1.0');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getInvoiceAccount', () => {
    test('passes the expected URL to the service request', async () => {
      const invoiceAccountId = uuid();
      await service.getInvoiceAccount(invoiceAccountId);
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/invoice-accounts/${invoiceAccountId}`);
    });
  });
});
