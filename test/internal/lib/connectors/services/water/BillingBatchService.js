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

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get');
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
});
