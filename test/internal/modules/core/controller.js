const sinon = require('sinon');
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();

const sandbox = sinon.createSandbox();

const controller = require('internal/modules/core/controller');

const createRequest = () => {
  return {
    view: {
      foo: 'bar'
    }
  };
};

experiment('core controller', () => {
  let h, code;

  beforeEach(async () => {
    code = sandbox.stub();
    h = {
      view: sandbox.stub().returns({
        code
      })
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
});
