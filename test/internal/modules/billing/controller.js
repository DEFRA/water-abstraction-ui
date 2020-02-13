'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const sandbox = require('sinon').createSandbox();

const { logger } = require('internal/logger');
const forms = require('shared/lib/forms');
const services = require('internal/lib/connectors/services');
const controller = require('internal/modules/billing/controller');
const batchService = require('internal/modules/billing/services/batch-service');
const transactionsCSV = require('internal/modules/billing/services/transactions-csv');
const csv = require('internal/lib/csv-download');

const billingRegions = {
  data: [
    {
      regionId: '07ae7f3a-2677-4102-b352-cc006828948c',
      chargeRegionId: 'A',
      naldRegionId: 1,
      name: 'Anglian',
      displayName: 'Anglian',
      dateCreated: '2019-11-05T12:10:35.164Z',
      dateUpdated: '2019-11-05T12:10:35.164Z'
    },
    {
      regionId: 'd8a257d4-b5a9-4420-ad51-d4fbe07b0f1a',
      chargeRegionId: 'B',
      naldRegionId: 2,
      name: 'Midlands',
      displayName: 'Midlands',
      dateCreated: '2019-11-05T12:10:35.164Z',
      dateUpdated: '2019-11-05T12:10:35.164Z'
    }
  ]
};

const secondHeader = sandbox.stub();
const header = sandbox.stub().returns({ header: secondHeader });

experiment('internal/modules/billing/controller', () => {
  let h, request;

  beforeEach(async () => {
    h = {
      view: sandbox.stub(),
      response: sandbox.stub().returns({ header }),
      redirect: sandbox.stub()
    };

    sandbox.stub(services.water.regions, 'getRegions').resolves(billingRegions);
    sandbox.stub(services.water.billingBatches, 'cancelBatch').resolves();
    sandbox.stub(services.water.billingBatches, 'approveBatch').resolves();
    sandbox.stub(batchService, 'getBatchList');
    sandbox.stub(batchService, 'getBatchInvoices');
    sandbox.stub(logger, 'info');

    request = {
      pre: {},
      params: {
        batchId: 'test-batch-id'
      },
      query: {},
      payload: {
        csrf_token: 'bfc56166-e983-4f01-90fe-f70c191017ca'
      },
      view: {},
      log: sandbox.spy(),
      defra: {
        userName: 'test-user@example.com'
      },
      yar: {
        get: sandbox.stub().returns({
          // form object or null depending on test
        }),
        set: sandbox.stub(),
        clear: sandbox.stub()
      }
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getBillingBatchType', () => {
    beforeEach(async () => {
      await controller.getBillingBatchType(request, h);
    });

    test('the expected view template is used for bill run type', async () => {
      const [templateName] = h.view.lastCall.args;
      expect(templateName).to.equal('nunjucks/form');
    });

    test('view context is assigned a back link path for type', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal('/manage');
    });
  });

  experiment('postBillingBatchType', () => {
    beforeEach(async () => {
      h = {
        redirect: sandbox.spy()
      };

      sandbox.stub(forms, 'getValues').returns({ selectedBillingType: 'supplementary' });
    });

    test('billingTypeForm is valid', async () => {
      sandbox.stub(forms, 'handleRequest').returns({ isValid: true });
      await controller.postBillingBatchType(request, h);
      const [url] = h.redirect.lastCall.args;
      expect(url).to.equal('/billing/batch/region/supplementary');
    });

    test('billingTypeForm is NOT valid', async () => {
      sandbox.stub(forms, 'handleRequest').returns({ isValid: false });
      await controller.postBillingBatchType(request, h);
      const [url] = h.redirect.lastCall.args;
      expect(url.startsWith('/billing/batch/type?form=')).to.be.true();
      expect(url).to.match(/[\d\w]{8}-[\d\w]{4}-[\d\w]{4}-[\d\w]{4}-[\d\w]{12}$/);
    });
  });

  experiment('postBillingBatchRegion', () => {
    const request = {
      defra: {
        user: { user_name: 'test@user.za' }
      },
      view: { csrfToken: '211e17c9-d285-437b-94c5-adc33ed99dc8' },
      params: { billingType: 'supplementary' },
      yar: {
        set: sandbox.stub()
      }
    };

    const billingRegionFrom = {
      action: '/billing/batch/region',
      method: 'POST',
      isSubmitted: true,
      isValid: true,
      fields: [
        {
          name: 'selectedBillingRegion',
          errors: [],
          value: '6ad67f32-e75d-48c1-93d5-25a0e6263e78'
        },
        {
          name: 'selectedBillingType',
          value: 'supplementary'
        },
        {
          name: 'csrf_token',
          value: '211e17c9-d285-437b-94c5-adc33ed99dc8'
        }
      ]
    };

    beforeEach(async () => {
      h = {
        redirect: sandbox.spy()
      };

      sandbox.stub(forms, 'getValues').returns({ selectedBillingType: 'supplementary' });
    });

    test('billingRegionFrom is valid redirects to waiting page', async () => {
      sandbox.stub(forms, 'handleRequest').returns(billingRegionFrom);
      sandbox.stub(services.water.billingBatches, 'createBillingBatch').resolves({ data: { event: { event_id: 'test-event-id' } } });
      await controller.postBillingBatchRegion(request, h);
      const [url] = h.redirect.lastCall.args;
      expect(url).to.equal('/waiting/test-event-id?back=0');
    });

    test('billingRegionFrom is NOT valid redirects back to form', async () => {
      sandbox.stub(forms, 'handleRequest').returns({ isValid: false });
      await controller.postBillingBatchRegion(request, h);
      const [url] = h.redirect.lastCall.args;
      expect(url.startsWith('/billing/batch/region/supplementary?')).to.be.true();
      expect(url).to.match(/[\d\w]{8}-[\d\w]{4}-[\d\w]{4}-[\d\w]{4}-[\d\w]{12}$/);
    });
  });

  experiment('ui flow tests for ui bill run region flow forms', () => {
    beforeEach(async () => {
      await controller.getBillingBatchRegion(request, h);
    });

    test('the expected view template is used for bill run type', async () => {
      const [templateName] = h.view.lastCall.args;
      expect(templateName).to.equal('nunjucks/form');
    });

    test('view context is assigned a back link path for type', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal('/billing/batch/type');
    });
  });

  experiment('.getBillingBatchExists', () => {
    beforeEach(async () => {
      request.pre.batch = {
        id: 'test-batch-id'
      };
      await controller.getBillingBatchExists(request, h);
    });

    test('the expected view template is used for bill run exist', async () => {
      const [templateName] = h.view.lastCall.args;
      expect(templateName).to.equal('nunjucks/billing/batch-exist');
    });

    test('adds a date to the view context', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.today).to.be.a.date();
    });

    test('view context is assigned a back link path for exist', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal('/billing/batch/region');
    });

    test('adds the batch from the pre handler to the view context', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.batch.id).to.equal('test-batch-id');
    });
  });

  experiment('.getBillingBatchCancel', () => {
    beforeEach(async () => {
      request = {
        params: {
          batchId: 'test-batch-id'
        },
        pre: {
          batch: {
            id: 'test-batch-id',
            dateCreated: '2019-12-02',
            region: {
              name: 'South West'
            },
            type: 'supplementary'
          }
        }
      };

      await controller.getBillingBatchCancel(request, h);
    });

    test('configures the back route', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.back).to.equal('/billing/batch/test-batch-id/summary');
    });

    test('passes the required batch data to the view', async () => {
      const [, context] = h.view.lastCall.args;
      const { batch } = context;

      expect(batch.type).to.equal('supplementary');
      expect(batch.id).to.equal('test-batch-id');
      expect(batch.region.name).to.equal('South West');
    });

    test('configures the expected view template', async () => {
      const [view] = h.view.lastCall.args;
      expect(view).to.equal('nunjucks/billing/batch-cancel');
    });
  });

  experiment('.postBillingBatchCancel', () => {
    let request;

    beforeEach(async () => {
      request = { params: { batchId: 'test-batch-id' } };
    });

    test('the batch id is used to cancel the batch via the water service', async () => {
      await controller.postBillingBatchCancel(request, h);
      const [batchId] = services.water.billingBatches.cancelBatch.lastCall.args;
      expect(batchId).to.equal('test-batch-id');
    });

    test('the user is redirected back to the list of batches', async () => {
      await controller.postBillingBatchCancel(request, h);
      const [redirectPath] = h.redirect.lastCall.args;
      expect(redirectPath).to.equal('/billing/batch/list');
    });

    test('if the cancellation failed, the user is still redirected back to the list of batches', async () => {
      services.water.billingBatches.cancelBatch.rejects();
      await controller.postBillingBatchCancel(request, h);

      const [redirectPath] = h.redirect.lastCall.args;
      expect(redirectPath).to.equal('/billing/batch/list');
    });
  });

  experiment('.getBillingBatchConfirm', () => {
    beforeEach(async () => {
      request = {
        params: {
          batchId: 'test-batch-id'
        },
        pre: {
          batch: {
            id: 'test-batch-id',
            dateCreated: '2019-12-02',
            region: {
              name: 'South West'
            },
            type: 'supplementary'
          }
        }
      };

      await controller.getBillingBatchConfirm(request, h);
    });

    test('configures the back route', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.back).to.equal('/billing/batch/test-batch-id/summary');
    });

    test('passes the required batch data to the view', async () => {
      const [, context] = h.view.lastCall.args;
      const { batch } = context;

      expect(batch.id).to.equal('test-batch-id');
      expect(batch.type).to.equal('supplementary');
      expect(batch.region.name).to.equal('South West');
    });

    test('configures the expected view template', async () => {
      const [view] = h.view.lastCall.args;
      expect(view).to.equal('nunjucks/billing/batch-confirm');
    });
  });

  experiment('.postBillingBatchConfirm', () => {
    beforeEach(async () => {
      const request = { params: { batchId: 'test-batch-id' } };
      await controller.postBillingBatchConfirm(request, h);
    });

    test('the batch id is used to approve the batch via the water service', async () => {
      const [batchId] = services.water.billingBatches.approveBatch.lastCall.args;
      expect(batchId).to.equal('test-batch-id');
    });

    test('the user is redirected back to the list of batches', async () => {
      const [redirectPath] = h.redirect.lastCall.args;
      expect(redirectPath).to.equal('/billing/batch/list');
    });

    test('if the approval fails, the user is still redirected back to the list of batches', async () => {
      services.water.billingBatches.approveBatch.rejects();
      await controller.postBillingBatchConfirm(request, h);

      const [redirectPath] = h.redirect.lastCall.args;
      expect(redirectPath).to.equal('/billing/batch/list');
    });
  });

  experiment('.getBillingBatchList', () => {
    let batchesResponse;

    beforeEach(async () => {
      batchesResponse = {
        data: [
          {
            season: 'all year',
            status: 'processing',
            region: {
              id: '07ae7f3a-2677-4102-b352-cc006828948c'
            },
            type: 'supplementary',
            dateCreated: '2019-11-29T12:24:06.585Z',
            id: '8ae7c31b-3c5a-44b8-baa5-a10b40aef9e2'
          },
          {
            season: 'summer',
            status: 'review',
            region: {
              id: 'd8a257d4-b5a9-4420-ad51-d4fbe07b0f1a'
            },
            type: 'two_part_tariff',
            dateCreated: '2019-11-29T12:24:29.449Z',
            id: 'b456f227-46c0-4354-a923-ad449671ad5d'
          }
        ],
        pagination: {
          page: 1,
          pageCount: 4,
          perPage: 2,
          totalRows: 8
        }
      };

      request = {
        query: {
          page: ''
        },
        view: {
          csrf_token: 'bfc56166-e983-4f01-90fe-f70c191017ca'
        }
      };

      batchService.getBatchList.resolves(batchesResponse);
      await controller.getBillingBatchList(request, h);
    });

    test('passes the required batch list data to the view', async () => {
      const [, context] = h.view.lastCall.args;
      const { batches } = context;
      expect(batches).to.be.array();
      expect(batches[0].batchType).to.equal('Supplementary');
      expect(batches[0].region.name).to.equal('Anglian');
      expect(batches[0].status).to.equal('processing');
      expect(batches[1].batchType).to.equal('Two-part tariff');
      expect(batches[1].region.name).to.equal('Midlands');
      expect(batches[1].status).to.equal('review');
    });

    test('configures the expected view template', async () => {
      const [view] = h.view.lastCall.args;
      expect(view).to.equal('nunjucks/billing/batch-list');
    });
  });

  experiment('getTransactionsCSV', () => {
    let batch, invoicesForBatch, csvData;
    beforeEach(async () => {
      batch = { id: 'test-batch-id' };
      request = {
        params: {
          batchId: 'test-batch-id'
        },
        pre: { batch }
      };
      invoicesForBatch = { data: { id: 'test-d', error: null } };
      csvData = [['header1', 'header2', 'header2'], ['transaction', 'line', 1]];
      sandbox.stub(services.water.billingBatches, 'getBatchInvoices').resolves(invoicesForBatch);
      sandbox.stub(batchService, 'getBatch').resolves(batch);
      sandbox.stub(transactionsCSV, 'createCSV').resolves(csvData);
      sandbox.stub(transactionsCSV, 'getCSVFileName').returns('fileName');
      sandbox.stub(csv, 'csvDownload');

      await controller.getTransactionsCSV(request, h);
    });

    test('calls billingBatches service with batchId', () => {
      const [batchId] = services.water.billingBatches.getBatchInvoices.lastCall.args;
      expect(services.water.billingBatches.getBatchInvoices.calledOnce).to.be.true();
      expect(batchId).to.equal(request.params.batchId);
    });

    test('calls transactionsCSV.createCSV with data returned from billingBatches services', () => {
      const [data] = transactionsCSV.createCSV.lastCall.args;
      expect(transactionsCSV.createCSV.calledOnce).to.be.true();
      expect(data).to.equal(invoicesForBatch.data);
    });

    test('calls transactionsCSV.getCSVFileName with data returned from batchService', () => {
      const [data] = transactionsCSV.getCSVFileName.lastCall.args;
      expect(transactionsCSV.getCSVFileName.calledOnce).to.be.true();
      expect(data).to.equal(batch);
    });

    test('calls csv.csvDownload with csv data and file name', () => {
      const [, data, fileName] = csv.csvDownload.lastCall.args;
      expect(data).to.equal(csvData);
      expect(fileName).to.equal('fileName');
    });
  });

  experiment('.getBillingBatchSummary', () => {
    let batchInvoicesResult;

    beforeEach(async () => {
      batchInvoicesResult = {
        batch: {
          type: 'two_part_tariff',
          billRunDate: (new Date(2000, 0, 1)).toISOString(),
          region: {
            name: 'Test Region',
            displayName: 'Test Region Display'
          }
        },
        invoices: [
          {
            invoiceAccount: {
              accountNumber: 'A1',
              company: {
                name: 'Comp A'
              }
            },
            invoiceLicences: [{ licence: { licenceNumber: '111' } }],
            totals: {
              totalValue: 111,
              totalCredits: 111,
              totalInvoices: 222
            }

          }, {
            invoiceAccount: {
              accountNumber: 'B2',
              company: {
                name: 'Comp B'
              }
            },
            invoiceLicences: [
              { licence: { licenceNumber: '222' } },
              { licence: { licenceNumber: '222/222' } }
            ],
            totals: {
              totalValue: -111,
              totalCredits: 333,
              totalInvoices: 222
            }

          }
        ],
        totals: {
          totalValue: 111,
          totalInvoices: 2,
          totalCredits: 1,
          numberOfInvoices: 2,
          numberOfCredits: 0
        }
      };
      batchService.getBatchInvoices.resolves(batchInvoicesResult);
    });

    test('the expected view template is used for bill run summary', async () => {
      const request = {
        params: { batchId: 'test-batch' },
        query: {}
      };

      await controller.getBillingBatchSummary(request, h);
      const [templateName] = h.view.lastCall.args;
      expect(templateName).to.equal('nunjucks/billing/batch-summary');
    });

    experiment('the view model is populated with', () => {
      let view;

      beforeEach(async () => {
        const request = {
          params: { batchId: 'test-batch' },
          query: {}
        };

        await controller.getBillingBatchSummary(request, h);
        ([, view] = h.view.lastCall.args);
      });

      test('the page title including the region name and batch type', async () => {
        expect(view.pageTitle).to.equal('Test Region Display two part tariff bill run');
      });

      test('the batch id', async () => {
        expect(view.batch.batchId).to.equal('test-batch');
      });

      test('the batch bill run date', async () => {
        expect(view.batch.billRunDate).to.equal('2000-01-01T00:00:00.000Z');
      });

      test('the batch totals', async () => {
        expect(view.batch.totals).to.equal(batchInvoicesResult.totals);
      });

      test('the charges summary from the batch invoices', async () => {
        expect(view.batch.charges[0].account).to.equal(batchInvoicesResult.invoices[0].invoiceAccount.accountNumber);
        expect(view.batch.charges[0].contact).to.equal(batchInvoicesResult.invoices[0].invoiceAccount.company.name);
        expect(view.batch.charges[0].licences).to.equal(['111']);
        expect(view.batch.charges[0].total).to.equal(batchInvoicesResult.invoices[0].totals.totalValue);
        expect(view.batch.charges[0].isCredit).to.be.false();

        expect(view.batch.charges[1].account).to.equal(batchInvoicesResult.invoices[1].invoiceAccount.accountNumber);
        expect(view.batch.charges[1].contact).to.equal(batchInvoicesResult.invoices[1].invoiceAccount.company.name);
        expect(view.batch.charges[1].licences).to.equal(['222', '222/222']);
        expect(view.batch.charges[1].total).to.equal(batchInvoicesResult.invoices[1].totals.totalValue);
        expect(view.batch.charges[1].isCredit).to.be.true();
      });
    });

    test('does not include the back link if the "back" query param is zero', async () => {
      const request = {
        query: { back: 0 },
        params: { batchId: 'test-batch' }
      };

      await controller.getBillingBatchSummary(request, h);
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal(0);
    });

    test('includes the back link if "back" query param is 1', async () => {
      const request = {
        query: { back: 1 },
        params: { batchId: 'test-batch' }
      };

      await controller.getBillingBatchSummary(request, h);
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal('/billing/batch/list');
    });
  });

  experiment('.getBillingBatchDeleteAccount', () => {
    const invoice = {
      data: {
        id: '1',
        invoiceLicences: [
          {
            licence: {
              id: 'licence-id',
              licenceNumber: 'AG1234/56789'
            }
          }
        ],
        dateCreated: '2020-01-27T13:51:29.234Z',
        totals: {
          totalValue: '1234.56'
        },
        invoiceAccount: {
          id: 'invoice-account-id',
          accountNumber: 'A12345678A',
          company: {
            name: 'company-name'
          }
        }
      }
    };
    beforeEach(async () => {
      request = {
        params: {
          batchId: 'test-batch-id',
          invoiceId: 'test-invoice-id'
        },
        view: {
          csrfToken: 'token'
        }
      };

      sandbox.stub(services.water.billingBatches, 'getBatchInvoice').resolves(invoice);
      await controller.getBillingBatchDeleteAccount(request, h);
    });

    test('configures the back route', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.back).to.equal('/billing/batch/test-batch-id/summary');
    });

    test('configures the expected view template', async () => {
      const [view] = h.view.lastCall.args;
      expect(view).to.equal('nunjucks/billing/batch-delete-account');
    });

    test('the correct view data is populated', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.account.id).to.equal(invoice.data.invoiceAccount.id);
      expect(view.account.accountNumber).to.equal(invoice.data.invoiceAccount.accountNumber);
      expect(view.account.companyName).to.equal(invoice.data.invoiceAccount.company.name);
      expect(view.account.licences[0].licenceRef).to.equal(invoice.data.invoiceLicences[0].licence.licenceNumber);
      expect(view.account.amount).to.equal(invoice.data.totals.totalValue);
      expect(view.account.dateCreated).to.equal(invoice.data.dateCreated);
    });
  });

  experiment('.postBillingBatchDeleteAccount', () => {
    beforeEach(async () => {
      h = {
        redirect: sandbox.spy()
      };
      request = {
        params: {
          batchId: 'test-batch-id',
          accountId: 'invoice-account-id'
        }
      };

      sandbox.stub(services.water.billingBatches, 'deleteAccountFromBatch').resolves(true);
      await controller.postBillingBatchDeleteAccount(request, h);
    });

    test('redirects to the expected url', async () => {
      const [url] = h.redirect.lastCall.args;
      expect(url).to.equal('/billing/batch/test-batch-id/summary');
    });
  });
});
