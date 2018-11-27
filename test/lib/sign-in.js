'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');
const uuid = require('uuid/v4');
const moment = require('moment');

const { createSessionData } = require('../../src/lib/sign-in');

const getTestEntityRole = (role, companyId = uuid()) => ({
  role,
  company_entity_id: companyId,
  entity_role_id: uuid(),
  entity_id: uuid(),
  regime_entity_id: uuid(),
  created_at: moment().toISOString(),
  created_by: uuid()
});

lab.experiment('sign-in.createSessionData', () => {
  let sessionData;
  let sessionId;
  let emailAddress;
  let userId;
  let entityId;
  let user;
  let roles;

  lab.beforeEach(async () => {
    sessionId = 'test-session-id';
    userId = 'user-id';
    entityId = 'entity-id';
    emailAddress = 'unit-test@example.com';
    roles = [
      getTestEntityRole('user', 'comp-1'),
      getTestEntityRole('user_returns', 'comp-1'),
      getTestEntityRole('user', 'comp-2'),
      getTestEntityRole('user_returns', 'comp-2')
    ];

    user = {
      user_id: userId,
      user_name: emailAddress,
      user_data: { test: 'data' },
      role: { scopes: ['test-scope'] },
      last_login: 'last-login'
    };

    sessionData = createSessionData(sessionId, user, entityId, roles);
  });

  lab.test('adds the session id', async () => {
    expect(sessionData.sid).to.equal(sessionId);
  });

  lab.test('add the email address as the user name', async () => {
    expect(sessionData.username).to.equal('unit-test@example.com');
  });

  lab.test('lowercases the email address', async () => {
    const data = createSessionData(sessionId, {
      user_name: 'UNIT-test@EXAMPLE.com'
    });
    expect(data.username).to.equal('unit-test@example.com');
  });

  lab.test('trims the email address', async () => {
    const data = createSessionData(sessionId, {
      user_name: '   unit-test@example.com    '
    });
    expect(data.username).to.equal('unit-test@example.com');
  });

  lab.test('adds the user id', async () => {
    expect(sessionData.user_id).to.equal(userId);
  });

  lab.test('adds the entity id', async () => {
    expect(sessionData.entity_id).to.equal(entityId);
  });

  lab.test('adds the user data from the user object', async () => {
    expect(sessionData.user_data.test).to.equal('data');
  });

  lab.test('adds the last login value from the user', async () => {
    expect(sessionData.lastlogin).to.equal(user.last_login);
  });

  lab.test('adds the roles', async () => {
    expect(sessionData.roles).to.equal([
      { role: 'user', company_entity_id: 'comp-1' },
      { role: 'user_returns', company_entity_id: 'comp-1' },
      { role: 'user', company_entity_id: 'comp-2' },
      { role: 'user_returns', company_entity_id: 'comp-2' }
    ]);
  });

  lab.test('adds the scopes from the user', async () => {
    expect(sessionData.scope).to.equal(user.role.scopes);
  });

  lab.test('sets user data newuser to true if no lastlogin', async () => {
    const neverLoggedInUser = {
      user_id: userId,
      user_name: emailAddress,
      user_data: { test: 'data' },
      role: { scopes: ['test-scope'] }
    };

    const data = createSessionData('id', neverLoggedInUser, 'eid', []);
    expect(data.user_data.newuser).to.be.true();
  });

  lab.test('sets user data last login to null if no lastlogin', async () => {
    const neverLoggedInUser = {
      user_id: userId,
      user_name: emailAddress,
      user_data: { test: 'data' },
      role: { scopes: ['test-scope'] }
    };

    const data = createSessionData('id', neverLoggedInUser, 'eid', []);
    expect(data.user_data.lastlogin).to.be.null();
  });

  lab.test('sets user data newuser to false if lastlogin exists', async () => {
    expect(sessionData.user_data.newuser).to.be.false();
  });

  lab.test('sets user data last login if lastlogin exists', async () => {
    expect(sessionData.user_data.lastlogin).to.equal(user.last_login);
  });
});
