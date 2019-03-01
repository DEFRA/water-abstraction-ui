const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const waterReturns = require('../../../../src/lib/connectors/water-service/returns');
const controller = require('../../../../src/modules/returns/controllers/upload');
const logger = require('../../../../src/lib/logger');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const eventId = 'event_1';
const userName = 'user_1';
const entityId = 'entity_1';
const companyId = 'company_1';
const csrfToken = 'csrf';
const returnId = 'v1:1:01/123:4567:2017-11-01:2018-10-31';

const createRequest = () => {
  return {
    view: {
      csrfToken
    },
    params: {
      eventId,
      returnId
    },
    auth: {
      credentials: {
        username: userName,
        entity_id: entityId,
        companyId
      }
    }
  };
};

const returns = [{
  returnId,
  isNil: true,
  errors: []
}, {
  returnId,
  isNil: true,
  errors: ['oh no']
}];

experiment('XML return upload controller', () => {
  const h = {
    view: sandbox.stub()
  };
  let request;

  beforeEach(async () => {
    sandbox.stub(logger, 'error');
    request = createRequest();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getSummary', () => {
    beforeEach(async () => {
      sandbox.stub(waterReturns, 'getUploadPreview').resolves(returns);
    });

    test('should call water returns API with correct params', async () => {
      await controller.getSummary(request, h);
      const { args } = waterReturns.getUploadPreview.lastCall;
      expect(args[0]).to.equal(eventId);
      expect(args[1]).to.equal({
        userName,
        entityId,
        companyId
      });
    });

    test('should use the correct template', async () => {
      await controller.getSummary(request, h);
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/returns/upload-summary.njk');
    });

    test('should set the correct view data', async () => {
      await controller.getSummary(request, h);
      const [, view] = h.view.lastCall.args;
      expect(view.pageTitle).to.equal(controller.pageTitles.error);
      expect(view.back).to.equal('/returns/upload');
      expect(view.returnsWithErrors).to.be.an.array();
      expect(view.returnsWithoutErrors).to.be.an.array();
      expect(view.form).to.be.an.object();
    });

    test('should have correct page title if there are no errors', async () => {
      waterReturns.getUploadPreview.resolves([returns[0]]);
      await controller.getSummary(request, h);
      const [, view] = h.view.lastCall.args;
      expect(view.pageTitle).to.equal(controller.pageTitles.ok);
    });

    test('should log an error if water returns API error', async () => {
      waterReturns.getUploadPreview.rejects();
      const func = () => controller.getSummary(request, h);
      await expect(func()).to.reject();

      const [message, params] = logger.error.lastCall.args;
      expect(message).to.be.a.string();
      expect(params).to.equal({
        eventId,
        options: {
          userName,
          entityId,
          companyId
        }
      });
    });
  });

  experiment('getSummaryReturn', () => {
    beforeEach(async () => {
      sandbox.stub(waterReturns, 'getUploadPreview').resolves(returns[0]);
    });

    test('should call water returns API with correct params', async () => {
      await controller.getSummaryReturn(request, h);
      const { args } = waterReturns.getUploadPreview.lastCall;
      expect(args[0]).to.equal(eventId);
      expect(args[1]).to.equal({
        userName,
        entityId,
        companyId
      });
      expect(args[2]).to.equal(returnId);
    });

    test('should output correct view data', async () => {
      await controller.getSummaryReturn(request, h);
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal(`/returns/upload-summary/${eventId}`);
      expect(view.return).to.be.an.object();
      expect(view.pageTitle).to.be.a.string();
      expect(view.lines).to.be.an.array();
    });

    test('should log an error if water returns API error', async () => {
      waterReturns.getUploadPreview.rejects();
      const func = () => controller.getSummaryReturn(request, h);
      await expect(func()).to.reject();

      const [message, params] = logger.error.lastCall.args;
      expect(message).to.be.a.string();
      expect(params).to.equal({
        eventId,
        returnId,
        options: {
          userName,
          entityId,
          companyId
        }
      });
    });
  });
});
