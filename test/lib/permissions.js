'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');

const { getPermissions } = require('../../src/lib/permissions');

const getCredentials = (scope = [], roles = [], entityId = null) => ({
  scope,
  roles: roles.map(role => ({ role })),
  entity_id: entityId
});

lab.experiment('getPermissions::internal user', () => {
  let internalPermissions;

  lab.beforeEach(async () => {
    const credentials = getCredentials(['internal'], [], 'entity-id');
    internalPermissions = await getPermissions(credentials);
  });

  lab.test('can read licences', async () => {
    expect(internalPermissions.licences.read).to.equal(true);
  });

  lab.test('cannot edit licences', async () => {
    expect(internalPermissions.licences.edit).to.equal(false);
  });

  lab.test('cannot be multi licence (agent)', async () => {
    expect(internalPermissions.licences.multi).to.equal(false);
  });

  lab.test('has admin permission', async () => {
    expect(internalPermissions.admin.defra).to.equal(true);
  });
});

lab.experiment('getPermissions::primary user', () => {
  let permissions;

  lab.beforeEach(async () => {
    const credentials = getCredentials(['external'], ['primary_user'], 'entity-id');
    permissions = await getPermissions(credentials);
  });

  lab.test('can read licences', async () => {
    expect(permissions.licences.read).to.equal(true);
  });

  lab.test('can edit licences', async () => {
    expect(permissions.licences.edit).to.equal(true);
  });

  lab.test('cannot be multi licence (agent)', async () => {
    expect(permissions.licences.multi).to.equal(false);
  });

  lab.test('does not have admin permission', async () => {
    expect(permissions.admin.defra).to.equal(false);
  });
});

lab.experiment('getPermissions::agent', () => {
  let permissions;

  lab.beforeEach(async () => {
    const credentials = getCredentials(['external'], ['primary_user', 'user'], 'entity-id');
    permissions = await getPermissions(credentials);
  });

  lab.test('user can read licences', async () => {
    expect(permissions.licences.read).to.equal(true);
  });

  lab.test('user can edit licences', async () => {
    expect(permissions.licences.edit).to.equal(false);
  });

  lab.test('user can be multi licence (agent)', async () => {
    expect(permissions.licences.multi).to.equal(true);
  });

  lab.test('user does not have admin permission', async () => {
    expect(permissions.admin.defra).to.equal(false);
  });
});

lab.experiment('getPermissions::no entity id', () => {
  lab.test('sets licence.read to false for external', async () => {
    const credentials = getCredentials(['external']);
    const permissions = await getPermissions(credentials);
    expect(permissions.licences.read).to.equal(false);
  });

  lab.test('sets licence.read to false for internal', async () => {
    const credentials = getCredentials(['internal']);
    const permissions = await getPermissions(credentials);
    expect(permissions.licences.read).to.equal(false);
  });
});

lab.experiment('getPermissions::no credentials', () => {
  let permissions;

  lab.beforeEach(async () => {
    permissions = await getPermissions();
  });

  lab.test('user cannot read licences', async () => {
    expect(permissions.licences.read).to.equal(false);
  });

  lab.test('user cannot edit licences', async () => {
    expect(permissions.licences.edit).to.equal(false);
  });

  lab.test('user cannot be multi licence (agent)', async () => {
    expect(permissions.licences.multi).to.equal(false);
  });

  lab.test('user does not have admin permission', async () => {
    expect(permissions.admin.defra).to.equal(false);
  });
});

lab.experiment('getPermissions::ar_user', () => {
  let permissions;

  lab.beforeEach(async () => {
    const credentials = getCredentials(['ar_user'], ['admin'], 'entity-id');
    permissions = await getPermissions(credentials);
  });

  lab.test('can read licences', async () => {
    expect(permissions.licences.read).to.equal(true);
  });

  lab.test('cannot edit licences', async () => {
    expect(permissions.licences.edit).to.equal(false);
  });

  lab.test('cannot be multi licence (agent)', async () => {
    expect(permissions.licences.multi).to.equal(false);
  });

  lab.test('has admin permission', async () => {
    expect(permissions.admin.defra).to.equal(true);
  });

  lab.test('can read abstraction reform', async () => {
    expect(permissions.ar.read).to.equal(true);
  });

  lab.test('can edit abstraction reform', async () => {
    expect(permissions.ar.edit).to.equal(true);
  });
});

lab.experiment('getPermissions::ar_approver', () => {
  let permissions;

  lab.beforeEach(async () => {
    const credentials = getCredentials(['ar_approver'], ['admin'], 'entity-id');
    permissions = await getPermissions(credentials);
  });

  lab.test('can read licences', async () => {
    expect(permissions.licences.read).to.equal(true);
  });

  lab.test('cannot edit licences', async () => {
    expect(permissions.licences.edit).to.equal(false);
  });

  lab.test('cannot be multi licence (agent)', async () => {
    expect(permissions.licences.multi).to.equal(false);
  });

  lab.test('has admin permission', async () => {
    expect(permissions.admin.defra).to.equal(true);
  });

  lab.test('can read abstraction reform', async () => {
    expect(permissions.ar.read).to.equal(true);
  });

  lab.test('can edit abstraction reform', async () => {
    expect(permissions.ar.edit).to.equal(true);
  });

  lab.test('can approve abstraction reform', async () => {
    expect(permissions.ar.approve).to.equal(true);
  });
});
