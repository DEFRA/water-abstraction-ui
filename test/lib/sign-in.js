'use strict';

const Lab = require('lab');
const { beforeEach, afterEach, experiment, test } = exports.lab = Lab.script();
const { expect } = require('code');
const sinon = require('sinon');
const Joi = require('joi');
const sandbox = sinon.createSandbox();

const idmConnector = require('../../src/lib/connectors/idm');
const crmConnector = require('../../src/lib/connectors/crm');
const { createSessionData, auto } = require('../../src/lib/sign-in');

experiment('createSessionData', () => {
  let sessionData;
  let sessionId;
  let emailAddress;
  let userId;
  let entityId;
  let user;

  beforeEach(async () => {
    sessionId = 'test-session-id';
    userId = 'user-id';
    entityId = 'entity-id';
    emailAddress = 'unit-test@example.com';

    user = {
      user_id: userId,
      user_name: emailAddress,
      user_data: { test: 'data' },
      role: { scopes: ['test-scope'] },
      last_login: 'last-login'
    };

    sessionData = createSessionData(sessionId, user, entityId);
  });

  test('adds the session id', async () => {
    expect(sessionData.sid).to.equal(sessionId);
  });

  test('add the email address as the user name', async () => {
    expect(sessionData.username).to.equal('unit-test@example.com');
  });

  test('lowercases the email address', async () => {
    const data = createSessionData(sessionId, {
      user_name: 'UNIT-test@EXAMPLE.com'
    });
    expect(data.username).to.equal('unit-test@example.com');
  });

  test('trims the email address', async () => {
    const data = createSessionData(sessionId, {
      user_name: '   unit-test@example.com    '
    });
    expect(data.username).to.equal('unit-test@example.com');
  });

  test('adds the user id', async () => {
    expect(sessionData.user_id).to.equal(userId);
  });

  test('adds the entity id', async () => {
    expect(sessionData.entity_id).to.equal(entityId);
  });

  test('adds the last login value from the user', async () => {
    expect(sessionData.lastLogin).to.equal(user.last_login);
  });
});

experiment('auto', () => {
  let request;

  beforeEach(async () => {
    sandbox.stub(idmConnector, 'getUserByEmail').resolves({
      error: null,
      data: [
        {
          user_id: 1,
          user_name: 'test@example.com',
          external_id: 'external-id',
          role: {
            scopes: ['one', 'two']
          }
        }
      ]
    });

    sandbox.stub(crmConnector.entities, 'getOrCreateIndividual').resolves('test-entity-id');

    sandbox.stub(idmConnector, 'updateExternalId').resolves();

    request = {
      sessionStore: {
        create: sinon.stub().resolves('test-session-id')
      },
      cookieAuth: {
        set: sinon.spy()
      },
      auth: {}
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('lowercases the email address before finding the user', async () => {
    const email = 'TEST@example.COM';
    await auto(request, email);

    const arg = idmConnector.getUserByEmail.args[0][0];
    expect(arg).to.equal('test@example.com');
  });

  test('trims the email address before finding the user', async () => {
    const email = '  test@example.com  ';
    await auto(request, email);

    const arg = idmConnector.getUserByEmail.args[0][0];
    expect(arg).to.equal('test@example.com');
  });

  test('updates the user external id if not on user object', async () => {
    const userWithoutExternalId = {
      user_id: 1,
      user_name: 'test@example.com'
    };

    idmConnector.getUserByEmail.resolves({
      error: null,
      data: [userWithoutExternalId]
    });

    await auto(request, 'test@example.com');

    const userArg = idmConnector.updateExternalId.args[0][0];
    const entityIdArg = idmConnector.updateExternalId.args[0][1];
    expect(userArg).to.equal(userWithoutExternalId);
    expect(entityIdArg).to.equal('test-entity-id');
  });

  test('does not update the user external id if on user', async () => {
    await auto(request, 'test@example.com');

    expect(crmConnector.entities.getOrCreateIndividual.called).to.be.false();
    expect(idmConnector.updateExternalId.called).to.be.false();
  });

  test('add the user to session', async () => {
    await auto(request, 'test@example.com');

    const sessionArg = request.sessionStore.create.args[0][0];
    expect(sessionArg.user.id).to.equal(1);
    expect(sessionArg.user.emailAddress).to.equal('test@example.com');
  });

  test('add a CSRF token to session', async () => {
    await auto(request, 'test@example.com');

    const sessionArg = request.sessionStore.create.args[0][0];
    expect(sessionArg.csrf_token).to.satisfy(value => {
      return Joi.validate(value, Joi.string().required().guid()).error === null;
    });
  });

  /**
   * The contents of this object are tested in the
   * createSessionData tests
   */
  test('adds some session data to the cookie', async () => {
    await auto(request, 'test@example.com');

    const cookieSetArg = request.cookieAuth.set.args[0][0];
    expect(cookieSetArg).to.be.an.object();
  });

  test('updates the auth.credentials object with the user scope', async () => {
    await auto(request, 'test@example.com');

    expect(request.auth.credentials.scope).to.equal(['one', 'two']);
  });
});
