'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const plugin = require('internal/modules/account-entry/plugin');

experiment('internal/modules/account-entry/plugin', () => {
  test('has a package name and version', async () => {
    expect(plugin.pkg.name).to.equal('accountEntryPlugin');
    expect(plugin.pkg.version).to.equal('1.0.0');
  });

  test('has a register method', async () => {
    expect(plugin.register).to.be.a.function();
  });
});
