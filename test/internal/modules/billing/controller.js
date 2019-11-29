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

experiment('internal/modules/billing/controller', () => {
  let h, request;

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getBillingRegions', () => {
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

    beforeEach(async () => {
      // sandbox.stub(logger, 'error');
      sandbox.stub(services.water.billingBatchCreateService, 'getBillingRegions').resolves(billingRegions);
      request = {
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

      h = {
        view: sandbox.stub()
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
});
