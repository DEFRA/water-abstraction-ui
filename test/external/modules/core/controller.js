const sinon = require('sinon');
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();

const sandbox = sinon.createSandbox();

const controller = require('external/modules/core/controller');

const createRequest = () => {
  return {
    view: {
      foo: 'bar'
    }
  };
};

experiment('external/modules/core/controller', () => {
  let h, code;

  beforeEach(async () => {
    code = sandbox.stub();
    h = {
      view: sandbox.stub().returns({
        code
      }),
      redirect: sandbox.spy()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getNotFoundError', () => {
    test('should render the correct template', async () => {
      const request = createRequest();
      await controller.getNotFoundError(request, h);
      const [path] = h.view.lastCall.args;
      expect(path).to.equal('nunjucks/errors/404');
    });

    test('should respond with a 404 status code', async () => {
      const request = createRequest();
      await controller.getNotFoundError(request, h);
      const [ statusCode ] = code.lastCall.args;
      expect(statusCode).to.equal(404);
    });
  });

  experiment('index', () => {
    test('redirects to /licences when not a google analytics cross domain request', async () => {
      const request = {
        query: {}
      };

      await controller.index(request, h);
      const [redirectUrl] = h.redirect.lastCall.args;
      expect(redirectUrl).to.equal('/licences');
    });

    test('redirects to /licences with _ga query param when a google analytics cross domain request', async () => {
      const request = {
        query: {
          _ga: 'testing'
        }
      };

      await controller.index(request, h);
      const [redirectUrl] = h.redirect.lastCall.args;
      expect(redirectUrl).to.equal('/licences?_ga=testing');
    });

    test('redirects to /licences but excludes other params', async () => {
      const request = {
        query: {
          not: 'forwarded'
        }
      };

      await controller.index(request, h);
      const [redirectUrl] = h.redirect.lastCall.args;
      expect(redirectUrl).to.equal('/licences');
    });
  });
});
