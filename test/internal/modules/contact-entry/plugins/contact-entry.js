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

const plugin = require('internal/modules/contact-entry/plugin');

experiment('internal/modules/contact-entry', () => {
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
    expect(plugin.pkg.name).to.equal('contactEntryPlugin');
    expect(plugin.pkg.version).to.equal('1.0.0');
  });

  test('has a register method', async () => {
    expect(plugin.register).to.be.a.function();
  });

  experiment('.register', () => {
    beforeEach(async () => {
      plugin.register(server);
    });
  });
});
