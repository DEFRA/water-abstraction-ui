const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const plugin = require('shared/plugins/cached-service-request');

experiment('plugins/cached-service-request/index', () => {
  let server, services;

  beforeEach(async () => {
    server = {
      ext: sandbox.stub(),
      method: sandbox.stub()
    };
    services = {
      testService: {
        testEntity: {
          getTestEntity: sandbox.stub()
        }
      }
    };
  });
  afterEach(async () => {
    sandbox.restore();
  });

  test('includes package name and version', async () => {
    expect(plugin.pkg).to.equal({
      name: 'cachedServiceRequest',
      version: '1.0.0'
    });
  });

  test('has a register function', async () => {
    expect(plugin.register).to.be.a.function();
  });

  experiment('when the register function is called', () => {
    beforeEach(async () => {
      plugin.register(server, { services });
    });

    test('a server method is registered', async () => {
      expect(server.method.called).to.be.true();
    });

    test('the server method has the correct arguments', async () => {
      const [name, method, options] = server.method.lastCall.args;
      expect(name).to.equal('cachedServiceRequest');
      expect(method).to.be.a.function();
      expect(options).to.equal({
        cache: {
          segment: 'cachedServiceRequest',
          expiresIn: 1000 * 60 * 15, // 15 minutes
          generateTimeout: 2000
        }
      });
    });

    test('calling the method calls the underlying service', async () => {
      const [, method] = server.method.lastCall.args;
      method('testService.testEntity.getTestEntity', 'test-id');
      expect(services.testService.testEntity.getTestEntity.calledWith('test-id')).to.be.true();
    });
  });
});
