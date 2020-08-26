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
    isSummer: true
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
    let id;

    experiment('when the batch totals are not requested', () => {
      beforeEach(async () => {
        id = uuid();
        await service.getBatch(id);
      });

      test('passes the expected URL to the service request', async () => {
        const [url] = serviceRequest.get.lastCall.args;
        expect(url).to.equal(`https://example.com/water/1.0/billing/batches/${id}`);
      });

      test('the totals query parameter is set to 0', async () => {
        const [, options] = serviceRequest.get.lastCall.args;
        expect(options).to.equal({ qs: { totals: 0 } });
      });
    });

    experiment('when the batch totals are requested', () => {
      beforeEach(async () => {
        id = uuid();
        await service.getBatch(id, true);
      });

      test('the totals query parameter is set to 0', async () => {
        const [, options] = serviceRequest.get.lastCall.args;
        expect(options).to.equal({ qs: { totals: 1 } });
      });
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

  experiment('.getBatchInvoicesDetails', () => {
    test('passes the expected URL to the service request', async () => {
      const id = uuid();

      await service.getBatchInvoicesDetails(id);

      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/billing/batches/${id}/invoices/details`);
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

  experiment('.deleteInvoiceFromBatch', () => {
    test('passes the expected URL to the service request', async () => {
      const batchId = uuid();
      const invoiceId = uuid();
      await service.deleteInvoiceFromBatch(batchId, invoiceId);
      const [url] = serviceRequest.delete.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/billing/batches/${batchId}/invoices/${invoiceId}`);
    });
  });

  experiment('.approveBatch', () => {
    test('passes the expected URL to the service request', async () => {
      const batchId = uuid();
      await service.approveBatch(batchId);
      const [url] = serviceRequest.post.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/billing/batches/${batchId}/approve`);
    });
  });

  experiment('.cancelBatch', () => {
    test('passes the expected URL to the service request', async () => {
      const batchId = uuid();
      await service.cancelBatch(batchId);
      const [url] = serviceRequest.delete.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/billing/batches/${batchId}`);
    });
  });

  experiment('.getBatchLicences', () => {
    test('passes the expected URL to the service request', async () => {
      const batchId = uuid();
      await service.getBatchLicences(batchId);
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/billing/batches/${batchId}/licences`);
    });
  });

  experiment('.approveBatchReview', () => {
    test('passes the expected URL to the service request', async () => {
      const batchId = uuid();
      await service.approveBatchReview(batchId);
      const [url] = serviceRequest.post.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/billing/batches/${batchId}/approve-review`);
    });
  });

  experiment('.getBatchLicenceBillingVolumes', () => {
    test('passes the expected URL to the service request', async () => {
      const batchId = uuid();
      const licenceId = uuid();
      await service.getBatchLicenceBillingVolumes(batchId, licenceId);
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/billing/batches/${batchId}/licences/${licenceId}/billing-volumes`);
    });
  });

  experiment('.deleteBatchLicence', () => {
    test('passes the expected URL to the service request', async () => {
      const batchId = uuid();
      const licenceId = uuid();
      await service.deleteBatchLicence(batchId, licenceId);
      const [url] = serviceRequest.delete.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/billing/batches/${batchId}/licences/${licenceId}`);
    });
  });
});
