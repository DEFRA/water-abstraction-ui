'use strict';

const Lab = require('lab');
const { experiment, beforeEach, test } = exports.lab = Lab.script();
const { expect } = require('code');
const { isString } = require('lodash');

const { getPermissions } = require('../../src/lib/permissions');

const getCredentials = (scope = [], roles = [], entityId = null) => ({
  scope,
  roles: roles.map(role => {
    return isString(role) ? { role } : role;
  }),
  entity_id: entityId
});

experiment('getPermissions::internal user', () => {
  let internalPermissions;

  beforeEach(async () => {
    const credentials = getCredentials(['internal'], [], 'entity-id');
    internalPermissions = await getPermissions(credentials);
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
    const credentials = getCredentials(['external'], ['primary_user'], 'entity-id');
    permissions = await getPermissions(credentials);
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
    const credentials = getCredentials(['external'], ['user'], 'entity-id');
    permissions = await getPermissions(credentials);
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
    const credentials = getCredentials(['external'], ['primary_user', 'user'], 'entity-id');
    const permissions = await getPermissions(credentials);
    expect(permissions.licences.multi).to.be.true();
  });
});

experiment('getPermissions::agent with data returns', () => {
  let permissions;

  beforeEach(async () => {
    const credentials = getCredentials(['external'], ['user', 'user_returns'], 'entity-id');
    permissions = await getPermissions(credentials);
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
    const permissions = await getPermissions(credentials);
    expect(permissions.licences.read).to.be.false();
  });

  test('sets licence.read to false for internal', async () => {
    const credentials = getCredentials(['internal']);
    const permissions = await getPermissions(credentials);
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
    const credentials = getCredentials(['ar_user'], ['admin'], 'entity-id');
    permissions = await getPermissions(credentials);
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
    const credentials = getCredentials(['ar_approver'], ['admin'], 'entity-id');
    permissions = await getPermissions(credentials);
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
    const credentials = getCredentials(['returns'], ['admin'], 'entity-id');
    permissions = await getPermissions(credentials);
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
