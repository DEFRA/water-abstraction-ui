const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const services = require('internal/lib/connectors/services');
const controller = require('internal/modules/billing/controller');
const batchService = require('internal/modules/billing/services/batchService');

const billingRegions = {
  'data': [
    {
      'regionId': '07ae7f3a-2677-4102-b352-cc006828948c',
      'chargeRegionId': 'A',
      'naldRegionId': 1,
      'name': 'Anglian',
      'dateCreated': '2019-11-05T12:10:35.164Z',
      'dateUpdated': '2019-11-05T12:10:35.164Z'
    },
    {
      'regionId': 'd8a257d4-b5a9-4420-ad51-d4fbe07b0f1a',
      'chargeRegionId': 'B',
      'naldRegionId': 2,
      'name': 'Midlands',
      'dateCreated': '2019-11-05T12:10:35.164Z',
      'dateUpdated': '2019-11-05T12:10:35.164Z'
    }
  ]
};
experiment('internal/modules/billing/controller', () => {
  let h, request;

  beforeEach(async () => {
    h = {
      view: sandbox.stub()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getRegions', () => {
    beforeEach(async () => {
      // sandbox.stub(logger, 'error');
      sandbox.stub(services.water.regions, 'getRegions').resolves(billingRegions);
      request = {
        params: {
          batchId: 'test-batch-id'
        },
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

    experiment('ui flow tests for ui bill run type flow forms', () => {
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

    experiment('ui flow tests for ui bill run exist', () => {
      beforeEach(async () => {
        await controller.getBillingBatchExist(request, h);
      });

      test('the expected view template is used for bill run exist', async () => {
        const [templateName] = h.view.lastCall.args;
        expect(templateName).to.equal('nunjucks/billing/batch-exist');
      });

      test('view context is assigned a back link path for exist', async () => {
        const [, view] = h.view.lastCall.args;
        expect(view.back).to.equal('/billing/batch/region');
      });
    });

    experiment('ui flow tests for ui bill run summary', () => {
      beforeEach(async () => {
        await controller.getBillingBatchSummary(request, h);
      });

      test('the expected view template is used for bill run summary', async () => {
        const [templateName] = h.view.lastCall.args;
        expect(templateName).to.equal('nunjucks/billing/batch-summary');
      });
    });
  });

  experiment('.getBillingBatchCancel', () => {
    beforeEach(async () => {
      request = {
        params: {
          batchId: 'test-batch-id'
        },
        defra: {
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

  experiment('.getBillingBatchConfirm', () => {
    beforeEach(async () => {
      request = {
        params: {
          batchId: 'test-batch-id'
        },
        defra: {
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

  experiment('.getBillingBatchList', () => {
    const getBatchList = (pageNumber) => {
      const batchList = {
        data:
        [ { event_id: '83a18e3d-473d-4b36-8c8a-0b1c373dac21',
          metadata: {
            batch:
            { season: 'all year',
              status: 'processing',
              region_id: '07ae7f3a-2677-4102-b352-cc006828948c',
              batch_type: 'supplementary',
              date_created: '2019-11-29T12:24:06.585Z',
              date_updated: '2019-11-29T12:24:06.585Z',
              billing_batch_id: '8ae7c31b-3c5a-44b8-baa5-a10b40aef9e2',
              to_financial_year_ending: 2020,
              from_financial_year_ending: 2014,
              invoices: { count: 12, total: 12345.67 + 987.65 }
            }
          },
          status: 'processing'
        },
        { event_id: '7e53df2e-5dcf-45d5-9a67-79ea57c122ec',
          metadata: {
            batch: {
              season: 'all year',
              status: 'processing',
              region_id: 'd8a257d4-b5a9-4420-ad51-d4fbe07b0f1a',
              batch_type: 'two_part_tarrif',
              date_created: '2019-11-29T12:24:29.449Z',
              date_updated: '2019-11-29T12:24:29.449Z',
              billing_batch_id: 'b456f227-46c0-4354-a923-ad449671ad5d',
              to_financial_year_ending: 2020,
              from_financial_year_ending: 2014,
              invoices: { count: 12, total: 12345.67 + 987.65 }
            }
          },
          status: 'complete'
        }
        ]
      };
      const response = {
        batchList,
        pagination: {
          page: pageNumber,
          pageCount: 4,
          perPage: 2,
          totalRows: 100,
          nextText: 'Later',
          previousText: 'Earlier'
        }
      };

      return response;
    };

    beforeEach(async () => {
      sandbox.stub(services.water.regions, 'getRegions').resolves(billingRegions);
      request = {
        query: {
          page: ''
        },
        view: {
          csrf_token: 'bfc56166-e983-4f01-90fe-f70c191017ca'
        }
      };

      await controller.getBillingBatchList(request, h);
      sandbox.stub(batchService, 'getBatchList').resolves(getBatchList());
    });

    test('passes the required batch list data to the view', async () => {
      const [, context] = h.view.lastCall.args;
      const { batches } = context;
      expect(batches).to.be.array();
      expect(batches[0].batchType).to.equal('Supplementary');
      expect(batches[0].region.name).to.equal('Anglian');
      expect(batches[0].status).to.equal('processing');
      expect(batches[0].invoices.total).to.equal(13333.32);
      expect(batches[0].invoices.count).to.equal(12);
    });

    test('configures the expected view template', async () => {
      const [view] = h.view.lastCall.args;
      expect(view).to.equal('nunjucks/billing/batch-list');
    });
  });
});
