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
const controller = require('internal/modules/billing/controllers/create-bill-run');
const batchService = require('internal/modules/billing/services/batch-service');
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
  pre: {
    batch: createBatchData(),
    regions: billingRegions.data
  },
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

experiment('internal/modules/billing/controllers/create-bill-run', () => {
  let h, request, batchData;

  beforeEach(async () => {
    batchData = createBatchData();

    h = {
      view: sandbox.stub(),
      response: sandbox.stub().returns({ header }),
      redirect: sandbox.stub(),
      postRedirectGet: sandbox.stub()
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
        test('the user is redirected to the billing batch type form', async () => {
          sandbox.stub(forms, 'handleRequest').returns({ isValid: false });

          await controller.postBillingBatchType(request, h);

          const [form] = h.postRedirectGet.lastCall.args;
          expect(form).to.be.an.object();
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
        test('the user is redirected to the billing batch type form', async () => {
          sandbox.stub(forms, 'handleRequest').returns({ isValid: false });

          await controller.postBillingBatchType(request, h);

          const [form] = h.postRedirectGet.lastCall.args;
          expect(form).to.be.an.object();
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
          batch: {
            id: 'test-batch-id',
            status: 'processing'
          }
        }
      });

      await controller.postBillingBatchRegion(request, h);

      const [url] = h.redirect.lastCall.args;
      expect(url).to.equal('/billing/batch/test-batch-id/processing?back=0');
    });

    test('billingRegionFrom is NOT valid redirects back to form', async () => {
      forms.handleRequest.returns({ isValid: false });

      await controller.postBillingBatchRegion(request, h);

      const [form] = h.postRedirectGet.lastCall.args;
      expect(form).to.be.an.object();
    });

    experiment('when the a live batch already exists', () => {
      test('the user is redirected to the batch-exists page', async () => {
        const id = uuid();
        services.water.billingBatches.createBillingBatch.rejects({
          statusCode: 409,
          error: {
            batch: {
              id,
              status: 'processing'
            }
          }
        });

        await controller.postBillingBatchRegion(request, h);

        const [url] = h.redirect.lastCall.args;
        expect(url).to.equal(`/billing/batch/${id}/exists`);
      });

      experiment('when the batch type has already been sent', () => {
        test('the user is redirected to the duplicate batch page', async () => {
          const id = uuid();
          services.water.billingBatches.createBillingBatch.rejects({
            statusCode: 409,
            error: {
              batch: {
                id,
                status: 'sent'
              }
            }
          });

          await controller.postBillingBatchRegion(request, h);

          const [url] = h.redirect.lastCall.args;
          expect(url).to.equal(`/billing/batch/${id}/duplicate`);
        });
      });
    });

    experiment(`for all bill runs except winter two part tariff the financial year is this year's`, () => {
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
              },
              batch: {
                id: 'test-batch-id'
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
            },
            batch: {
              id: 'test-batch-id'
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
      expect(templateName).to.equal('nunjucks/billing/batch-creation-error');
    });

    test('adds a date to the view context', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.today).to.be.a.date();
    });

    test('view context contains the expected back link', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal('/billing/batch/region');
    });

    test('adds the batch from the pre handler to the view context', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.batch.id).to.equal('test-batch-id');
    });

    test('view context contains batch creation error', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.error).to.equal('liveBatchExists');
    });
  });

  experiment('.getBillingBatchDuplicate', () => {
    beforeEach(async () => {
      request.pre.batch = {
        id: 'test-batch-id'
      };
      await controller.getBillingBatchDuplicate(request, h);
    });

    test('the expected view template is used for bill run exist', async () => {
      const [templateName] = h.view.lastCall.args;
      expect(templateName).to.equal('nunjucks/billing/batch-creation-error');
    });

    test('adds a date to the view context', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.today).to.be.a.date();
    });

    test('view context contains the expected back link', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal('/billing/batch/region');
    });

    test('adds the batch from the pre handler to the view context', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.batch.id).to.equal('test-batch-id');
    });

    test('view context contains batch creation error', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.error).to.equal('duplicateSentBatch');
    });
  });
});
