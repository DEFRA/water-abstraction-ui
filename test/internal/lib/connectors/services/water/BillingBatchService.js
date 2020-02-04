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

const BillingBatchService = require('internal/lib/connectors/services/water/BillingBatchService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('services/water/BillingBatchService', () => {
  let service;

  const batch = {
    'userEmail': 'userEmail@testmail.com',
    'regionId': 'selectedBillingRegion',
    'batchType': 'annual',
    'financialYear': new Date().getFullYear(),
    'season': 'summer' // ('summer', 'winter', 'all year').required();
  };

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get');
    sandbox.stub(serviceRequest, 'post');
    sandbox.stub(serviceRequest, 'delete');
    service = new BillingBatchService('https://example.com/water/1.0');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getBatch', () => {
    test('passes the expected URL to the service request', async () => {
      const id = uuid();

      await service.getBatch(id);

      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/billing/batches/${id}`);
    });
  });

  experiment('.getBatchInvoices', () => {
    test('passes the expected URL to the service request', async () => {
      const id = uuid();

      await service.getBatchInvoices(id);

      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/billing/batches/${id}/invoices`);
    });
  });

  experiment('.getBatchInvoice', () => {
    test('passes the expected URL to the service request', async () => {
      const batchId = uuid();
      const invoiceId = uuid();

      await service.getBatchInvoice(batchId, invoiceId);

      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/billing/batches/${batchId}/invoices/${invoiceId}`);
    });
  });

  experiment('.getBatches', () => {
    let page;
    let perPage;

    beforeEach(async () => {
      page = 2;
      perPage = 10;
      await service.getBatches(page, perPage);
    });

    test('passes the expected URL to the service request', async () => {
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/billing/batches`);
    });

    test('passes the pagination params on the query string', async () => {
      const [, options] = serviceRequest.get.lastCall.args;
      expect(options.qs.page).to.equal(page);
      expect(options.qs.perPage).to.equal(perPage);
    });
  });

  experiment('.createBillingBatch', () => {
    test('passes the expected URL to the service request', async () => {
      await service.createBillingBatch(batch);
      const [url] = serviceRequest.post.lastCall.args;
      expect(url).to.equal('https://example.com/water/1.0/billing/batches');
    });

    test('passes the expected body to the service request', async () => {
      await service.createBillingBatch(batch);
      const [ , { body } ] = serviceRequest.post.lastCall.args;
      expect(body).to.equal(batch);
    });
  });

  experiment('.deleteAccountFromBatch', () => {
    test('passes the expected URL to the service request', async () => {
      const batchId = uuid();
      const accountId = uuid();
      await service.deleteAccountFromBatch(batchId, accountId);
      const [url] = serviceRequest.delete.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/billing/batches/${batchId}/account/${accountId}`);
    });
  });
});
