'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const { logger } = require('internal/logger');
const forms = require('shared/lib/forms');
const services = require('internal/lib/connectors/services');
const controller = require('internal/modules/billing/controllers/bill-run');
const batchService = require('internal/modules/billing/services/batch-service');
const transactionsCSV = require('internal/modules/billing/services/transactions-csv');
const csv = require('internal/lib/csv-download');
const helpers = require('@envage/water-abstraction-helpers');
const billRunTypes = require('internal/modules/billing/lib/bill-run-types');
const seasons = require('internal/modules/billing/lib/seasons');

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

const createBatchData = () => ({
  id: 'test-batch-id',
  dateCreated: '2000-01-01T00:00:00.000Z',
  type: 'supplementary',
  region: {
    id: 'test-region-1',
    name: 'Anglian',
    code: 'A'
  },
  totals: {
    netTotal: 43434
  },
  billRunId: 1234
});

const invoice = {
  id: '1',
  invoiceLicences: [
    {
      id: 'invoice-licence-id',
      transactions: [],
      licence: {
        licenceNumber: '12/34/56'
      }
    }],
  dateCreated: '2020-01-27T13:51:29.234Z',
  totals: {
    netTotal: '1234.56'
  },
  invoiceAccount: {
    id: 'invoice-account-id',
    accountNumber: 'A12345678A',
    company: {
      name: 'COMPANY NAME'
    }
  }
};

const batchInvoicesResult = [
  {
    id: '4abf7d0a-6148-4781-8c6a-7a8b9267b4a9',
    accountNumber: 'A12345678A',
    name: 'Test company 1',
    netTotal: 12345,
    licenceNumbers: [
      '01/123/A'
    ],
    isWaterUndertaker: false
  },
  {
    id: '9a806cbb-f1b9-49ae-b551-98affa2d2b9b',
    accountNumber: 'A89765432A',
    name: 'Test company 2',
    netTotal: -675467,
    licenceNumbers: [
      '04/567/B'
    ],
    isWaterUndertaker: true
  }];

const secondHeader = sandbox.stub();
const header = sandbox.stub().returns({ header: secondHeader });

const createRequest = () => ({
  pre: { batch: createBatchData() },
  params: {
    batchId: 'test-batch-id',
    invoiceId: 'test-invoice-id'
  },
  query: { back: 0 },
  payload: {
    csrf_token: 'bfc56166-e983-4f01-90fe-f70c191017ca'
  },
  view: { foo: 'bar' },
  log: sandbox.spy(),
  defra: {
    user: {
      user_name: 'test-user@example.com'
    }
  },
  yar: {
    get: sandbox.stub().returns({
      // form object or null depending on test
    }),
    set: sandbox.stub(),
    clear: sandbox.stub()
  }
});

experiment('internal/modules/billing/controller', () => {
  let h, request, batchData;

  beforeEach(async () => {
    batchData = createBatchData();

    h = {
      view: sandbox.stub(),
      response: sandbox.stub().returns({ header }),
      redirect: sandbox.stub()
    };

    sandbox.stub(services.water.regions, 'getRegions').resolves(billingRegions);
    sandbox.stub(services.water.billingBatches, 'getBatch').resolves(batchData);
    sandbox.stub(services.water.billingBatches, 'getBatchInvoice').resolves(invoice);
    sandbox.stub(services.water.billingBatches, 'getBatchInvoices').resolves(batchInvoicesResult);

    sandbox.stub(services.water.billingBatches, 'cancelBatch').resolves();
    sandbox.stub(services.water.billingBatches, 'approveBatch').resolves();

    sandbox.stub(batchService, 'getBatchList');
    sandbox.stub(batchService, 'getBatchInvoice').resolves({ id: 'invoice-account-id', accountNumber: 'A12345678A' });
    sandbox.stub(logger, 'info');

    request = createRequest();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getBillingBatchType', () => {
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

  experiment('.postBillingBatchType', () => {
    experiment('for a two part tariff bill run ', () => {
      beforeEach(async () => {
        sandbox.stub(forms, 'getValues').returns({
          selectedBillingType: 'two_part_tariff',
          twoPartTariffSeason: 'summer'
        });
      });

      experiment('when the form is valid', () => {
        test('the user is redirected to the expected URL including the season', async () => {
          sandbox.stub(forms, 'handleRequest').returns({ isValid: true });

          await controller.postBillingBatchType(request, h);

          const [url] = h.redirect.lastCall.args;
          expect(url).to.equal('/billing/batch/region/two-part-tariff/summer');
        });
      });

      experiment('when the form is not valid', () => {
        test('the user is redirected to region page', async () => {
          sandbox.stub(forms, 'handleRequest').returns({ isValid: false });

          await controller.postBillingBatchType(request, h);

          const [url] = h.redirect.lastCall.args;
          expect(url.startsWith('/billing/batch/type?form=')).to.be.true();
          expect(url).to.match(/[\d\w]{8}-[\d\w]{4}-[\d\w]{4}-[\d\w]{4}-[\d\w]{12}$/);
        });
      });
    });

    experiment('for an annual bill run ', () => {
      beforeEach(async () => {
        sandbox.stub(forms, 'getValues').returns({
          selectedBillingType: 'annual'
        });
      });

      experiment('when the form is valid', () => {
        test('the user is redirected to the expected URL', async () => {
          sandbox.stub(forms, 'handleRequest').returns({ isValid: true });

          await controller.postBillingBatchType(request, h);

          const [url] = h.redirect.lastCall.args;
          expect(url).to.equal('/billing/batch/region/annual');
        });
      });

      experiment('when the form is not valid', () => {
        test('the user is redirected to region page', async () => {
          sandbox.stub(forms, 'handleRequest').returns({ isValid: false });

          await controller.postBillingBatchType(request, h);

          const [url] = h.redirect.lastCall.args;
          expect(url.startsWith('/billing/batch/type?form=')).to.be.true();
          expect(url).to.match(/[\d\w]{8}-[\d\w]{4}-[\d\w]{4}-[\d\w]{4}-[\d\w]{12}$/);
        });
      });
    });
  });

  experiment('.getBillingBatchRegion', () => {
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

  experiment('.postBillingBatchRegion', () => {
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
      sandbox.stub(forms, 'getValues').returns({
        selectedBillingType: 'supplementary',
        selectedTwoPartTariffSeason: ''
      });

      sandbox.stub(forms, 'handleRequest').returns(billingRegionFrom);
      sandbox.stub(services.water.billingBatches, 'createBillingBatch');
    });

    test('billingRegionFrom is valid redirects to waiting page', async () => {
      services.water.billingBatches.createBillingBatch.resolves({
        data: {
          event: { id: 'test-event-id' }
        }
      });

      await controller.postBillingBatchRegion(request, h);

      const [url] = h.redirect.lastCall.args;
      expect(url).to.equal('/waiting/test-event-id?back=0');
    });

    test('billingRegionFrom is NOT valid redirects back to form', async () => {
      forms.handleRequest.returns({ isValid: false });

      await controller.postBillingBatchRegion(request, h);

      const [url] = h.redirect.lastCall.args;
      expect(url.startsWith('/billing/batch/region/supplementary?')).to.be.true();
      expect(url).to.match(/[\d\w]{8}-[\d\w]{4}-[\d\w]{4}-[\d\w]{4}-[\d\w]{12}$/);
    });

    experiment('when the batch already exists', () => {
      test('the user is redirected to the batch-exists page', async () => {
        const id = uuid();
        services.water.billingBatches.createBillingBatch.rejects({
          statusCode: 409,
          error: {
            existingBatch: { id }
          }
        });

        await controller.postBillingBatchRegion(request, h);

        const [url] = h.redirect.lastCall.args;

        expect(url).to.equal(`/billing/batch/${id}/exists`);
      });
    });

    experiment(`for all bill runs except winter two part tariff the finacial year is this year's`, () => {
      const billRunCombinations = [
        { billRunType: billRunTypes.ANNUAL },
        { billRunType: billRunTypes.SUPPLEMENTARY },
        { billRunType: billRunTypes.TWO_PART_TARIFF, season: seasons.SUMMER }
      ];

      billRunCombinations.forEach(combo => {
        test(`the financial year for ${combo.billRunType} is this year`, async () => {
          forms.getValues.returns({
            selectedBillingType: combo.billRunType,
            selectedTwoPartTariffSeason: combo.season
          });

          forms.handleRequest.returns({ isValid: true });
          services.water.billingBatches.createBillingBatch.resolves({
            data: {
              event: {
                id: uuid()
              }
            }
          });

          await controller.postBillingBatchRegion(request, h);

          const [batch] = services.water.billingBatches.createBillingBatch.lastCall.args;
          const financialYear = helpers.charging.getFinancialYear(new Date());
          expect(batch.financialYearEnding).to.equal(financialYear);
        });
      });
    });

    experiment(`for a winter two part tariff bill run`, () => {
      test(`the financial year is the previous year`, async () => {
        forms.getValues.returns({
          selectedBillingType: billRunTypes.TWO_PART_TARIFF,
          selectedTwoPartTariffSeason: seasons.WINTER_AND_ALL_YEAR
        });

        forms.handleRequest.returns({ isValid: true });
        services.water.billingBatches.createBillingBatch.resolves({
          data: {
            event: {
              id: uuid()
            }
          }
        });

        await controller.postBillingBatchRegion(request, h);

        const [batch] = services.water.billingBatches.createBillingBatch.lastCall.args;
        const financialYear = helpers.charging.getFinancialYear(new Date());
        expect(batch.financialYearEnding).to.equal(financialYear - 1);
      });
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

  experiment('.getBillingBatchSummary', () => {
    experiment('when the batch type is annual', async () => {
      beforeEach(async () => {
        request.pre.batch.type = 'annual';
        await controller.getBillingBatchSummary(request, h);
      });

      experiment('the view model is populated with', () => {
        let view;

        beforeEach(async () => {
          ([, view] = h.view.lastCall.args);
        });

        test('invoices divided into 2 groups for water undertakers and other abstractors', async () => {
          expect(view.invoices).to.be.an.object();
          expect(view.invoices.waterUndertakers).to.be.an.array().length(1);
          expect(view.invoices.otherAbstractors).to.be.an.array().length(1);
        });

        test('the "water undertakers" group only includes invoices where the flag is set', async () => {
          expect(view.invoices.waterUndertakers[0].isWaterUndertaker).to.be.true();
        });

        test('the "other abstractors" group only includes invoices where the flag is cleared', async () => {
          expect(view.invoices.otherAbstractors[0].isWaterUndertaker).to.be.false();
        });
      });
    });

    experiment('when the batch type is not annual', async () => {
      beforeEach(async () => {
        // batchService.getBatchInvoices.resolves(batchInvoicesResult);
        await controller.getBillingBatchSummary(request, h);
      });

      test('the expected view template is used for bill run summary', async () => {
        const [templateName] = h.view.lastCall.args;
        expect(templateName).to.equal('nunjucks/billing/batch-summary');
      });

      experiment('the view model is populated with', () => {
        let view;

        beforeEach(async () => {
          ([, view] = h.view.lastCall.args);
        });

        test('the page title including the region name and batch type', async () => {
          expect(view.pageTitle).to.equal('Supplementary bill run');
        });

        test('includes the correct sub-heading', async () => {
          expect(view.subHeading).to.equal('2 supplementary bills');
        });

        test('the batch data', async () => {
          expect(view.batch).to.equal(request.pre.batch);
        });

        test('the first invoice, with isCredit flag true', async () => {
          expect(view.invoices[0]).to.equal({
            id: '9a806cbb-f1b9-49ae-b551-98affa2d2b9b',
            accountNumber: 'A89765432A',
            isWaterUndertaker: true,
            group: 'waterUndertakers',
            name: 'Test company 2',
            netTotal: -675467,
            licenceNumbers: [
              '04/567/B'
            ],
            isCredit: true,
            sortValue: -675467
          });
        });

        test('the second invoice, with isCredit flag false', async () => {
          expect(view.invoices[1]).to.equal({
            id: '4abf7d0a-6148-4781-8c6a-7a8b9267b4a9',
            accountNumber: 'A12345678A',
            isWaterUndertaker: false,
            group: 'otherAbstractors',
            name: 'Test company 1',
            netTotal: 12345,
            licenceNumbers: [
              '01/123/A'
            ],
            isCredit: false,
            sortValue: -12345
          });
        });
      });

      test('does not include the back link if the "back" query param is zero', async () => {
        await controller.getBillingBatchSummary(request, h);
        const [, view] = h.view.lastCall.args;
        expect(view.back).to.equal(0);
      });

      test('includes the back link if "back" query param is 1', async () => {
        await controller.getBillingBatchSummary({ ...request, query: { back: 1 } }, h);
        const [, view] = h.view.lastCall.args;
        expect(view.back).to.equal('/billing/batch/list');
      });
    });
  });

  experiment('.getBillingBatchInvoice', () => {
    let docIds;
    beforeEach(async () => {
      docIds = new Map();
      docIds.set('12/34/56', 'test-docuemnt-id');
      sandbox.stub(services.crm.documents, 'getDocumentIdMap').resolves(docIds);
      await controller.getBillingBatchInvoice(request, h);
    });

    test('calls getBatch in billingBatches service with batchId', async () => {
      const [batchId] = services.water.billingBatches.getBatch.lastCall.args;
      expect(batchId).to.equal(request.params.batchId);
    });

    test('calls getBatchInvoice in billingBatches service with batchId and invoiceId', async () => {
      const [batchId, invoiceId] = services.water.billingBatches.getBatchInvoice.lastCall.args;
      expect(batchId).to.equal(request.params.batchId);
      expect(invoiceId).to.equal(request.params.invoiceId);
    });

    test('the expected view template is used', async () => {
      const [templateName] = h.view.lastCall.args;
      expect(templateName).to.equal('nunjucks/billing/batch-invoice');
    });

    test('the expected data', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view).to.contain({ foo: 'bar' });
      expect(view.back).to.equal(`/billing/batch/${request.params.batchId}/summary`);
      expect(view.pageTitle).to.equal('Bill for Company Name');
      expect(view.invoice).to.equal(invoice);
      expect(view.batch).to.equal(batchData);
      expect(view.batchType).to.equal('Supplementary');
      expect(view.transactions).to.be.an.object();
      expect(view.isCredit).to.be.false();
      expect(view.caption).to.equal('Billing account A12345678A');
    });
  });

  experiment('.getBillingBatchList', () => {
    let batchesResponse;

    beforeEach(async () => {
      batchesResponse = {
        data: [
          {
            invoices: [],
            id: '8ae7c31b-3c5a-44b8-baa5-a10b40aef9e1',
            type: 'supplementary',
            season: 'all year',
            status: 'processing',
            dateCreated: '2019-11-29T12:24:06.585Z',
            dataUpdated: '2019-11-29T12:24:06.585Z',
            startYear: {
              yearEnding: 2020
            },
            endYear: {
              yearEnding: 2020
            },
            region: {
              type: 'region',
              id: '07ae7f3a-2677-4102-b352-cc006828948c',
              name: 'Anglian',
              code: 'A',
              numericCode: 1
            },
            totals: {
              creditNoteCount: 2,
              invoiceCount: 12,
              netTotal: 4005
            },
            externalId: 1234
          },
          {
            invoices: [],
            id: '8ae7c31b-3c5a-44b8-baa5-a10b40aef9e2',
            type: 'Two-part tariff',
            season: 'all year',
            status: 'review',
            dateCreated: '2019-11-29T12:24:06.585Z',
            dataUpdated: '2019-11-29T12:24:06.585Z',
            startYear: {
              yearEnding: 2020
            },
            endYear: {
              yearEnding: 2020
            },
            region: {
              type: 'region',
              id: 'd8a257d4-b5a9-4420-ad51-d4fbe07b0f1a',
              name: 'Midlands',
              code: 'M',
              numericCode: 2
            }
          }
        ],
        pagination: {
          page: 1,
          pageCount: 4,
          perPage: 2,
          totalRows: 8
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
      expect(batches[0].billCount).to.equal(14);
      expect(batches[0].link).to.equal('/billing/batch/8ae7c31b-3c5a-44b8-baa5-a10b40aef9e1/summary');
      expect(batches[1].type).to.equal('Two-part tariff');
      expect(batches[1].region.name).to.equal('Midlands');
      expect(batches[1].status).to.equal('review');
      expect(batches[1].billCount).to.equal(null);
      expect(batches[1].link).to.be.equal('/billing/batch/8ae7c31b-3c5a-44b8-baa5-a10b40aef9e2/two-part-tariff-review');
    });

    test('configures the expected view template', async () => {
      const [view] = h.view.lastCall.args;
      expect(view).to.equal('nunjucks/billing/batch-list');
    });
  });

  experiment('.getBillingBatchCancel', () => {
    beforeEach(async () => {
      await controller.getBillingBatchCancel(request, h);
    });

    test('passes the expected view template', async () => {
      const [view] = h.view.lastCall.args;
      expect(view).to.equal('nunjucks/billing/batch-cancel-or-confirm');
    });

    test('passes the expedcted data in the view context', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context).to.contain({ foo: 'bar' });
      expect(context.batch).to.equal(batchData);
      expect(context.pageTitle).to.equal('You are about to cancel this bill run');
      expect(context.secondTitle).to.equal(`Supplementary bill run`);
      expect(context.form).to.be.an.object();
      expect(context.form.action).to.equal(`/billing/batch/${request.params.batchId}/cancel`);
      expect(context.back).to.equal('/billing/batch/test-batch-id/summary');
    });
  });

  experiment('.postBillingBatchCancel', () => {
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
      await controller.getBillingBatchConfirm(request, h);
    });

    test('passes the expected view template', async () => {
      const [view] = h.view.lastCall.args;
      expect(view).to.equal('nunjucks/billing/batch-cancel-or-confirm');
    });

    test('passes the expected data in the view context', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context).to.contain({ foo: 'bar' });
      expect(context.batch).to.equal(batchData);
      expect(context.pageTitle).to.equal('You are about to send this bill run');
      expect(context.secondTitle).to.equal(`Supplementary bill run`);
      expect(context.form).to.be.an.object();
      expect(context.form.action).to.equal(`/billing/batch/${request.params.batchId}/confirm`);
      expect(context.back).to.equal('/billing/batch/test-batch-id/summary');
    });
  });

  experiment('.postBillingBatchConfirm', () => {
    beforeEach(async () => {
      await controller.postBillingBatchConfirm(request, h);
    });

    test('the batch id is used to approve the batch via the water service', async () => {
      const [batchId] = services.water.billingBatches.approveBatch.lastCall.args;
      expect(batchId).to.equal('test-batch-id');
    });

    test('the user is redirected back to the batch summary', async () => {
      const [redirectPath] = h.redirect.lastCall.args;
      expect(redirectPath).to.equal('/billing/batch/test-batch-id/summary');
    });

    test('if the approval fails, the user is redirected to the batch summary, an error is thrown', async () => {
      services.water.billingBatches.approveBatch.rejects();
      const func = () => controller.postBillingBatchConfirm(request, h);
      expect(func()).to.reject();
    });
  });

  experiment('getTransactionsCSV', () => {
    let invoicesForBatch, csvData;

    beforeEach(async () => {
      invoicesForBatch = [ { id: 'test-d', invoiceLicences: [], error: null } ];
      csvData = [['header1', 'header2', 'header2'], ['transaction', 'line', 1]];
      sandbox.stub(services.water.billingBatches, 'getBatchInvoicesDetails').resolves(invoicesForBatch);
      sandbox.stub(transactionsCSV, 'createCSV').resolves(csvData);
      sandbox.stub(transactionsCSV, 'getCSVFileName').returns('fileName');
      sandbox.stub(csv, 'csvDownload');
      await controller.getTransactionsCSV(request, h);
    });

    test('calls billingBatches service with batchId', () => {
      const [batchId] = services.water.billingBatches.getBatchInvoicesDetails.lastCall.args;
      expect(services.water.billingBatches.getBatchInvoicesDetails.calledOnce).to.be.true();
      expect(batchId).to.equal(request.params.batchId);
    });

    test('calls transactionsCSV.createCSV with data returned from billingBatches services', () => {
      const [ data ] = transactionsCSV.createCSV.lastCall.args;
      expect(transactionsCSV.createCSV.calledOnce).to.be.true();
      expect(data).to.equal(invoicesForBatch);
    });

    test('calls transactionsCSV.getCSVFileName with data returned from batchService', () => {
      const [data] = transactionsCSV.getCSVFileName.lastCall.args;
      expect(transactionsCSV.getCSVFileName.calledOnce).to.be.true();
      expect(data).to.equal(batchData);
    });

    test('calls csv.csvDownload with csv data and file name', () => {
      const [, data, fileName] = csv.csvDownload.lastCall.args;
      expect(data).to.equal(csvData);
      expect(fileName).to.equal('fileName');
    });
  });

  experiment('.getBillingBatchDeleteAccount', () => {
    beforeEach(async () => {
      await controller.getBillingBatchDeleteAccount(request, h);
    });

    test('configures the expected view template', async () => {
      const [view] = h.view.lastCall.args;
      expect(view).to.equal('nunjucks/billing/batch-delete-account');
    });

    test('sets the correct view data', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context).to.contain({ foo: 'bar' });
      expect(context.pageTitle).to.equal('You are about to remove this bill from the bill run');
      expect(context.account.id).to.equal('invoice-account-id');
      expect(context.account.accountNumber).to.equal('A12345678A');
      expect(context.form).to.be.an.object();
      expect(context.batch).to.equal(batchData);
      expect(context.back).to.equal('/billing/batch/test-batch-id/summary');
    });
  });

  experiment('.postBillingBatchDeleteAccount', () => {
    beforeEach(async () => {
      sandbox.stub(services.water.billingBatches, 'deleteAccountFromBatch').resolves(true);
      await controller.postBillingBatchDeleteAccount(request, h);
    });

    test('redirects to the expected url', async () => {
      const [url] = h.redirect.lastCall.args;
      expect(url).to.equal('/billing/batch/test-batch-id/summary');
    });
  });
});
