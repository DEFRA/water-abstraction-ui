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
  let server;

  beforeEach(async () => {
    server = {
      decorate: sandbox.stub()
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

    test('the request object is decorated with "getDraftChargeInformation"', async () => {
      const [obj, name, func] = server.decorate.firstCall.args;
      expect(obj).to.equal('request');
      expect(name).to.equal('getDraftChargeInformation');
      expect(func).to.be.a.function();
    });

    test('the request object is decorated with "setDraftChargeInformation"', async () => {
      const [obj, name, func] = server.decorate.secondCall.args;
      expect(obj).to.equal('request');
      expect(name).to.equal('setDraftChargeInformation');
      expect(func).to.be.a.function();
    });

    test('the request object is decorated with "clearDraftChargeInformation"', async () => {
      const [obj, name, func] = server.decorate.thirdCall.args;
      expect(obj).to.equal('request');
      expect(name).to.equal('clearDraftChargeInformation');
      expect(func).to.be.a.function();
    });
  });

  experiment('._generateChargeVersion', () => {
    test('gets initial state', () => {
      const initialState = plugin._generateChargeVersion('test-id');
      expect(initialState).to.equal({
        changeReason: null,
        dateRange: { startDate: null },
        chargeElements: [],
        invoiceAccount: null,
        status: 'draft'
      });
    });
  });
});
