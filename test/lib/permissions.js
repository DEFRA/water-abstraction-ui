'use strict';

const Lab = require('lab');
const { experiment, beforeEach, test } = exports.lab = Lab.script();
const { expect } = require('code');

const { getPermissions } = require('../../src/lib/permissions');

const getCredentials = (scope = [], entityId = null) => ({
  scope,
  entity_id: entityId
});

experiment('getPermissions::internal user', () => {
  let internalPermissions;

  beforeEach(async () => {
    const credentials = getCredentials(['internal'], 'entity-id');
    const entityRoles = [];
    internalPermissions = await getPermissions(credentials, entityRoles);
  });

  test('can read licences', async () => {
    expect(internalPermissions.licences.read).to.be.true();
  });

  test('cannot edit licences', async () => {
    expect(internalPermissions.licences.edit).to.be.false();
  });

  test('can read returns', async () => {
    expect(internalPermissions.returns.read).to.be.true();
  });

  test('cannot edit returns', async () => {
    expect(internalPermissions.returns.edit).to.be.false();
  });

  test('cannot be multi licence (agent)', async () => {
    expect(internalPermissions.licences.multi).to.be.false();
  });

  test('has admin permission', async () => {
    expect(internalPermissions.admin.defra).to.be.true();
  });
});

experiment('getPermissions::primary user', () => {
  let permissions;

  beforeEach(async () => {
    const credentials = getCredentials(['external'], 'entity-id');
    const entityRoles = [{ role: 'primary_user' }];
    permissions = await getPermissions(credentials, entityRoles);
  });

  test('can read licences', async () => {
    expect(permissions.licences.read).to.be.true();
  });

  test('can edit licences', async () => {
    expect(permissions.licences.edit).to.be.true();
  });

  test('cannot be multi licence (agent)', async () => {
    expect(permissions.licences.multi).to.be.false();
  });

  test('does not have admin permission', async () => {
    expect(permissions.admin.defra).to.be.false();
  });

  test('can read returns', async () => {
    expect(permissions.returns.read).to.be.true();
  });

  test('can submit returns', async () => {
    expect(permissions.returns.submit).to.be.true();
  });

  test('cannot edit returns', async () => {
    expect(permissions.returns.edit).to.be.false();
  });
});

experiment('getPermissions::agent', () => {
  let permissions;

  beforeEach(async () => {
    const credentials = getCredentials(['external'], 'entity-id');
    const entityRoles = [{ role: 'user' }];
    permissions = await getPermissions(credentials, entityRoles);
  });

  test('user can read licences', async () => {
    expect(permissions.licences.read).to.be.true();
  });

  test('user can edit licences', async () => {
    expect(permissions.licences.edit).to.be.false();
  });

  test('cannot read returns', async () => {
    expect(permissions.returns.read).to.be.false();
  });

  test('cannot edit returns', async () => {
    expect(permissions.returns.edit).to.be.false();
  });

  test('user does not have admin permission', async () => {
    expect(permissions.admin.defra).to.be.false();
  });

  test('cannot edit returns', async () => {
    expect(permissions.returns.edit).to.be.false();
  });
});

experiment('getPermissions::multi licence user', () => {
  test('user can be multi licence (agent)', async () => {
    const credentials = getCredentials(['external'], 'entity-id');
    const entityRoles = [{ role: 'primary_user' }, { role: 'user' }];
    const permissions = await getPermissions(credentials, entityRoles);
    expect(permissions.licences.multi).to.be.true();
  });
});

experiment('getPermissions::agent with data returns', () => {
  let permissions;

  beforeEach(async () => {
    const credentials = getCredentials(['external'], 'entity-id');
    const entityRoles = [{ role: 'user' }, { role: 'user_returns' }];
    permissions = await getPermissions(credentials, entityRoles);
  });

  test('user can read licences', async () => {
    expect(permissions.licences.read).to.be.true();
  });

  test('user can edit licences', async () => {
    expect(permissions.licences.edit).to.be.false();
  });

  test('user can be multi licence', async () => {
    expect(permissions.licences.multi).to.be.false();
  });

  test('user does not have admin permission', async () => {
    expect(permissions.admin.defra).to.be.false();
  });

  test('can read returns', async () => {
    expect(permissions.returns.read).to.be.true();
  });

  test('can submit returns', async () => {
    expect(permissions.returns.submit).to.be.true();
  });

  test('cannot edit returns', async () => {
    expect(permissions.returns.edit).to.be.false();
  });
});

experiment('getPermissions::no entity id', () => {
  test('sets licence.read to false for external', async () => {
    const credentials = getCredentials(['external']);
    const entityRoles = [];
    const permissions = await getPermissions(credentials, entityRoles);
    expect(permissions.licences.read).to.be.false();
  });

  test('sets licence.read to false for internal', async () => {
    const credentials = getCredentials(['internal']);
    const entityRoles = [];
    const permissions = await getPermissions(credentials, entityRoles);
    expect(permissions.licences.read).to.be.false();
  });
});

experiment('getPermissions::no credentials', () => {
  let permissions;

  beforeEach(async () => {
    permissions = await getPermissions();
  });

  test('user cannot read licences', async () => {
    expect(permissions.licences.read).to.be.false();
  });

  test('user cannot edit licences', async () => {
    expect(permissions.licences.edit).to.be.false();
  });

  test('user cannot be multi licence (agent)', async () => {
    expect(permissions.licences.multi).to.be.false();
  });

  test('user does not have admin permission', async () => {
    expect(permissions.admin.defra).to.be.false();
  });

  test('cannot read returns', async () => {
    expect(permissions.returns.read).to.be.false();
  });

  test('cannot edit returns', async () => {
    expect(permissions.returns.edit).to.be.false();
  });
});

experiment('getPermissions::ar_user', () => {
  let permissions;

  beforeEach(async () => {
    const credentials = getCredentials(['ar_user'], 'entity-id');
    const entityRoles = [{ role: 'admin' }];
    permissions = await getPermissions(credentials, entityRoles);
  });

  test('can read licences', async () => {
    expect(permissions.licences.read).to.be.true();
  });

  test('cannot edit licences', async () => {
    expect(permissions.licences.edit).to.be.false();
  });

  test('cannot be multi licence (agent)', async () => {
    expect(permissions.licences.multi).to.be.false();
  });

  test('has admin permission', async () => {
    expect(permissions.admin.defra).to.be.true();
  });

  test('can read abstraction reform', async () => {
    expect(permissions.ar.read).to.be.true();
  });

  test('can edit abstraction reform', async () => {
    expect(permissions.ar.edit).to.be.true();
  });

  test('can read returns', async () => {
    expect(permissions.returns.read).to.be.true();
  });

  test('cannot edit returns', async () => {
    expect(permissions.returns.edit).to.be.false();
  });
});

experiment('getPermissions::ar_approver', () => {
  let permissions;

  beforeEach(async () => {
    const credentials = getCredentials(['ar_approver'], 'entity-id');
    const entityRoles = [{ role: 'admin' }];
    permissions = await getPermissions(credentials, entityRoles);
  });

  test('can read licences', async () => {
    expect(permissions.licences.read).to.be.true();
  });

  test('cannot edit licences', async () => {
    expect(permissions.licences.edit).to.be.false();
  });

  test('cannot be multi licence (agent)', async () => {
    expect(permissions.licences.multi).to.be.false();
  });

  test('has admin permission', async () => {
    expect(permissions.admin.defra).to.be.true();
  });

  test('can read abstraction reform', async () => {
    expect(permissions.ar.read).to.be.true();
  });

  test('can edit abstraction reform', async () => {
    expect(permissions.ar.edit).to.be.true();
  });

  test('can approve abstraction reform', async () => {
    expect(permissions.ar.approve).to.be.true();
  });

  test('can read returns', async () => {
    expect(permissions.returns.read).to.be.true();
  });

  test('cannot edit returns', async () => {
    expect(permissions.returns.edit).to.be.false();
  });
});

experiment('getPermissions::internal returns user', () => {
  let permissions;

  beforeEach(async () => {
    const credentials = getCredentials(['returns'], 'entity-id');
    const entityRoles = [{ role: 'admin' }];
    permissions = await getPermissions(credentials, entityRoles);
  });

  test('can read licences', async () => {
    expect(permissions.licences.read).to.be.true();
  });

  test('cannot edit licences', async () => {
    expect(permissions.licences.edit).to.be.false();
  });

  test('cannot be multi licence (agent)', async () => {
    expect(permissions.licences.multi).to.be.false();
  });

  test('has admin permission', async () => {
    expect(permissions.admin.defra).to.be.true();
  });

  test('can read abstraction reform', async () => {
    expect(permissions.ar.read).to.be.false();
  });

  test('can edit abstraction reform', async () => {
    expect(permissions.ar.edit).to.be.false();
  });

  test('can approve abstraction reform', async () => {
    expect(permissions.ar.approve).to.be.false();
  });

  test('can read returns', async () => {
    expect(permissions.returns.read).to.be.true();
  });

  test('cannot edit returns', async () => {
    expect(permissions.returns.edit).to.be.true();
  });
});
