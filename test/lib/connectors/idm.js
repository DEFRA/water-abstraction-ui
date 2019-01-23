'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Code = require('code');
// const rewire = require('rewire');

const idm = require('../../../src/lib/connectors/idm.js');

lab.experiment('idm.login', () => {
  lab.test('function exists', async () => {
    Code.expect(idm.login).to.be.a.function();
  });
});

lab.experiment('idm.resetPassword', () => {
  lab.test('function exists', async () => {
    Code.expect(idm.resetPassword).to.be.a.function();
  });
});

lab.experiment('idm.getPasswordResetLink', () => {
  lab.test('function exists', async () => {
    Code.expect(idm.getPasswordResetLink).to.be.a.function();
  });
});

lab.experiment('idm.updatePassword', () => {
  lab.test('function exists', async () => {
    Code.expect(idm.updatePassword).to.be.a.function();
  });
});

lab.experiment('idm.updatePasswordWithGuid', () => {
  lab.test('function exists', async () => {
    Code.expect(idm.updatePasswordWithGuid).to.be.a.function();
  });
});
