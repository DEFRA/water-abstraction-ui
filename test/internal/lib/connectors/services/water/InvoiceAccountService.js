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
  const invoiceAccountId = uuid();

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get');
    sandbox.stub(serviceRequest, 'post');

    service = new InvoiceAccountService('https://example.com/water/1.0');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getInvoiceAccount', () => {
    test('passes the expected URL to the service request', async () => {
      await service.getInvoiceAccount(invoiceAccountId);
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/invoice-accounts/${invoiceAccountId}`);
    });
  });

  experiment('.createInvoiceAccountAddress', () => {
    const data = { address: {}, agentCompany: null, contact: null };

    beforeEach(async () => {
      await service.createInvoiceAccountAddress(invoiceAccountId, data);
    });

    test('passes the expected URL to the service request', async () => {
      const [url] = serviceRequest.post.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/invoice-accounts/${invoiceAccountId}/addresses`);
    });

    test('passes the expected payload to the service request', async () => {
      const [, { body }] = serviceRequest.post.lastCall.args;
      expect(body).to.equal(data);
    });
  });

  experiment('.getLicences', () => {
    beforeEach(async () => {
      await service.getLicences(invoiceAccountId);
    });

    test('passes the expected URL to the service request', async () => {
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/invoice-accounts/${invoiceAccountId}/licences`);
    });
  });
});
