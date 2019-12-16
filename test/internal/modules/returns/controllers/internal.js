const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const uuid = require('uuid/v4');

const services = require('internal/lib/connectors/services');
const helpers = require('internal/modules/returns/lib/helpers');

const controller = require('internal/modules/returns/controllers/internal');

const returnId = 'test-return-id';

const createRequest = () => ({
  query: {
    returnId
  },
  view: {
    csrfToken: uuid()
  },
  auth: {
    credentials: {
      scope: 'internal'
    }
  },
  defra: {
    userScopes: []
  }
});

const createPostLogReceiptRequest = (isUnderQuery) => {
  const request = createRequest();
  return {
    ...request,
    payload: {
      csrf_token: request.view.csrfToken,
      'dateReceived-day': '27',
      'dateReceived-month': '3',
      'dateReceived-year': '2019',
      isUnderQuery: isUnderQuery ? 'under_query' : undefined
    }
  };
};

const createReturn = () => ({
  returnId,
  frequency: 'month',
  meters: [],
  reading: {},
  metadata: {}
});

experiment('internal returns controller', () => {
  beforeEach(async () => {
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('log receipt', () => {
    let h, request;

    beforeEach(async () => {
      sandbox.stub(services.water.returns, 'getReturn').resolves(createReturn());
      sandbox.stub(helpers, 'getViewData').resolves({ foo: 'bar' });
      sandbox.stub(services.water.returns, 'patchReturn').resolves({ error: null });
      h = {
        view: sandbox.stub(),
        redirect: sandbox.stub()
      };
    });

    afterEach(async () => {
      sandbox.restore();
    });

    experiment('getLogReceipt', () => {
      beforeEach(async () => {
        request = createRequest();
      });

      test('should get the return with the ID specified in the query', async () => {
        await controller.getLogReceipt(request, h);
        const [ returnId ] = services.water.returns.getReturn.lastCall.args;
        expect(returnId).to.equal(request.query.returnId);
      });

      test('should get view data with the request and return data', async () => {
        await controller.getLogReceipt(request, h);
        const [ req, data ] = helpers.getViewData.lastCall.args;
        expect(req).to.equal(request);
        expect(data).to.be.an.object();
        expect(data.returnId).to.equal(returnId);
      });

      test('should render the correct template', async () => {
        await controller.getLogReceipt(request, h);
        const [ template ] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/returns/form');
      });

      test('should pass correct data to the view', async () => {
        await controller.getLogReceipt(request, h);
        const [ , view ] = h.view.lastCall.args;
        expect(view.return).to.be.an.object();
        expect(view.foo).to.equal('bar');
        expect(view.back).to.be.a.string();
        expect(view.form).to.be.an.object();
      });
    });

    experiment('postLogReceipt', () => {
      beforeEach(async () => {
        request = createPostLogReceiptRequest();
      });

      test('should get the return with the ID specified in the query', async () => {
        await controller.postLogReceipt(request, h);
        const [ returnId ] = services.water.returns.getReturn.lastCall.args;
        expect(returnId).to.equal(request.query.returnId);
      });

      test('should re-render view if form data not valid', async () => {
        request.payload['dateReceived-day'] = 'not-a-day';
        await controller.postLogReceipt(request, h);
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/returns/form');
      });

      test('should patch the return with the correct details when not under query', async () => {
        await controller.postLogReceipt(request, h);
        const [ data ] = services.water.returns.patchReturn.lastCall.args;

        expect(data.receivedDate).to.equal('2019-03-27');
        expect(data.isUnderQuery).to.equal(false);
        expect(data.status).to.equal('received');
      });

      test('should patch the return with the correct details when under query', async () => {
        request = createPostLogReceiptRequest(true);
        await controller.postLogReceipt(request, h);
        const [ data ] = services.water.returns.patchReturn.lastCall.args;
        expect(data.receivedDate).to.equal('2019-03-27');
        expect(data.isUnderQuery).to.equal(true);
        expect(data.status).to.equal('received');
      });

      test('should redirect', async () => {
        await controller.postLogReceipt(request, h);
        expect(h.redirect.callCount).to.equal(1);
      });
    });
  });
});
