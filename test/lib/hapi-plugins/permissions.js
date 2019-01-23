'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Code = require('code');

const { hasPermission } = require('../../../src/lib/hapi-plugins/permissions');

const permissions = {
  admin: {
    view: true,
    edit: false
  }
};

lab.experiment('Check hasPermission in HAPI permissions plugin', () => {
  lab.test('Permission granted', async () => {
    Code.expect(hasPermission('admin.view', permissions)).to.equal(true);
  });

  lab.test('Permission denied', async () => {
    Code.expect(hasPermission('admin.edit', permissions)).to.equal(false);
  });

  lab.test('Invalid permission should throw error', async () => {
    const func = () => {
      return hasPermission('admin.invalid', permissions);
    };

    Code.expect(func).to.throw(Error, 'Attempt to check invalid permission admin.invalid');
  });
});
