'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');

const sandbox = sinon.createSandbox();

const plugin = require('internal/modules/charge-information/plugins/charge-information');

experiment('internal/modules/charge-information/plugins/charge-information', () => {
  let server, policy;

  beforeEach(async () => {
    policy = {
      get: sandbox.stub(),
      set: sandbox.stub()
    };
    server = {
      cache: sandbox.stub().returns(policy),
      method: sandbox.stub()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('has a package name and version', async () => {
    expect(plugin.pkg.name).to.equal('chargeInformationPlugin');
    expect(plugin.pkg.version).to.equal('1.0.0');
  });

  test('has a register method', async () => {
    expect(plugin.register).to.be.a.function();
  });

  experiment('.register', () => {
    beforeEach(async () => {
      plugin.register(server);
    });

    test('a policy is created', async () => {
      const [options] = server.cache.lastCall.args;
      expect(options.expiresIn).to.equal(31536000000);
      expect(options.segment).to.equal('draftChargeInformation');
      expect(options.generateFunc).to.be.a.function();
      expect(options.generateTimeout).to.equal(2000);
    });

    test('a getDraftChargeInformation server method is registered', async () => {
      const [name, func] = server.method.firstCall.args;
      expect(name).to.equal('getDraftChargeInformation');
      expect(func).to.be.a.function();
    });

    test('.getDraftChargeInformation server method gets the data from the cache', async () => {
      const [, func] = server.method.firstCall.args;
      func('test-id');
      expect(policy.get.calledWith('test-id')).to.be.true();
    });

    test('.getDraftChargeInformation server method gets the data from the cache', async () => {
      const [, func] = server.method.secondCall.args;
      func('test-id', { foo: 'bar' });
      expect(policy.set.calledWith('test-id', { foo: 'bar' })).to.be.true();
    });
  });

  experiment('.generateChargeVersion', () => {
    test('gets initial state', () => {
      const initialState = plugin._generateChargeVersion('test-id');
      expect(initialState).to.equal({
        licenceId: 'test-id',
        changeReason: null,
        startDate: null,
        chargeElements: [],
        invoiceAccount: null
      });
    });
  });
});
