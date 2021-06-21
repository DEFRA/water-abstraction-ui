const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('@hapi/code');

const controller = require('../../../../src/internal/modules/gauging-stations/controller');
const helpers = require('../../../../src/internal/modules/gauging-stations/lib/helpers');
const session = require('../../../../src/internal/modules/gauging-stations/lib/session');
const formHandler = require('../../../../src/shared/lib/form-handler');

experiment('internal/modules/gauging-stations/controller', () => {
  beforeEach(async () => {
    sandbox.stub(helpers, 'getCaption').resolves('a caption is output');
    sandbox.stub(session, 'get').resolves({});
    sandbox.stub(session, 'merge').resolves({});
    sandbox.stub(formHandler, 'handleFormRequest').resolves();
  });

  afterEach(async () => sandbox.restore());

  experiment('.getNewFlow', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/start'
    };

    const h = { redirect: sandbox.spy() };

    test('redirects the user to the start of the flow', async () => {
      await controller.getNewFlow(request, h);
      expect(h.redirect.calledWith(`${request.path}/../threshold-and-unit`));
    });
  });

  experiment('.getThresholdAndUnit', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/threshold',
      method: 'get',
      view: {
        csrfToken: 'some-token'
      }
    };

    const h = { view: sandbox.spy() };

    beforeEach(() => {
      controller.getThresholdAndUnit(request, h);
    });
    afterEach(async () => sandbox.restore());

    test('calls the helper method which generates a caption', async () => {
      expect(helpers.getCaption.called).to.be.true();
    });
  });

  experiment('.postThresholdAndUnit', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/threshold',
      method: 'post',
      view: {
        csrfToken: 'some-token'
      }
    };

    const h = {
      view: sandbox.spy(),
      postRedirectGet: sandbox.spy()
    };

    experiment('when the payload is invalid', () => {
      beforeEach(() => {
        formHandler.handleFormRequest.resolves({
          isValid: false
        });
        controller.postThresholdAndUnit(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('calls handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
      test('redirects the user back to the form', () => {
        expect(h.postRedirectGet.called).to.be.true();
      });
    });

    experiment('when the payload is valid', () => {
      beforeEach(() => {
        formHandler.handleFormRequest.resolves({
          isValid: true
        });
        controller.postThresholdAndUnit(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('calls handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
    });
  });
});
