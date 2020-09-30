'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const plugin = require('internal/modules/contact-entry/plugin');

experiment('internal/modules/contact-entry/plugin', () => {
  test('has a package name and version', async () => {
    expect(plugin.pkg.name).to.equal('contactEntryPlugin');
    expect(plugin.pkg.version).to.equal('1.0.0');
  });

  test('has a register method', async () => {
    expect(plugin.register).to.be.a.function();
  });
});
