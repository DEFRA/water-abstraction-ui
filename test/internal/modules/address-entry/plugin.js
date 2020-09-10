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

const plugin = require('internal/modules/address-entry/plugin');

experiment('internal/modules/address-entry/plugin', () => {
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
    expect(plugin.pkg.name).to.equal('addressLookupPlugin');
    expect(plugin.pkg.version).to.equal('1.0.0');
  });

  test('has a register method', async () => {
    expect(plugin.register).to.be.a.function();
  });

  experiment('.register', () => {
    beforeEach(async () => {
      plugin.register(server);
    });

    test('the request object is decorated with "getNewAddress"', async () => {
      const [obj, name, func] = server.decorate.firstCall.args;
      expect(obj).to.equal('request');
      expect(name).to.equal('getNewAddress');
      expect(func).to.be.a.function();
    });

    test('the request object is decorated with "setNewAddress"', async () => {
      const [obj, name, func] = server.decorate.lastCall.args;
      expect(obj).to.equal('request');
      expect(name).to.equal('setNewAddress');
      expect(func).to.be.a.function();
    });
  });
});
