const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { experiment, test, beforeEach, afterEach, before } = exports.lab = require('@hapi/lab').script();

const services = require('external/lib/connectors/services');
const controller = require('external/modules/notify/controller');

experiment('callback', () => {
  const request = {
    method: 'POST',
    url: '/notify/callback',
    headers: { authorization: 'Bearer test' },
    payload: {}
  };

  const responseStub = {
    code: sandbox.stub()
  };

  const h = {
    response: sinon.stub().returns(responseStub)
  };

  beforeEach(async () => {
    sandbox.stub(services.water.notify, 'postNotifyCallback').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('when it has no token', () => {
    before(async () => {
      request.headers = {};
    });
    test('returns Unauthorized', async () => {
      await controller.callback(request, h);
      expect(h.response.calledWith('Unauthorized')).to.be.true();
      expect(responseStub.code.calledWith(403)).to.be.true();
    });
  });

  experiment('when it has an invalid token', () => {
    before(async () => {
      request.headers = {
        authorization: 'Bearer an-invalid-token'
      };
      await controller.callback(request, h);
    });
    test('returns Unauthorized', async () => {
      await controller.callback(request, h);
      expect(h.response.calledWith('Unauthorized')).to.be.true();
      expect(responseStub.code.calledWith(403)).to.be.true();
    });
  });

  experiment('when it has a valid token', () => {
    before(async () => {
      request.headers = {
        authorization: `Bearer ${process.env.NOTIFY_CALLBACK_TOKEN}`
      };
    });
    test('returns 204 with blank body', async () => {
      await controller.callback(request, h);
      expect(responseStub.code.calledWith(204)).to.be.true();
    });
  });
});
