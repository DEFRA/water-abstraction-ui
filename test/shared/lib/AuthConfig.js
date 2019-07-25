const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const AuthConfig = require('shared/lib/AuthConfig');

experiment('AuthConfig base class', () => {
  let authConfig, connectors;

  const userId = 'user_1';
  const userName = 'mail@example.com';
  const password = 'topSecret';
  const entityId = 'entity_1';

  const config = {
    idm: {
      application: 'water_test'
    }
  };

  const idmAuthResponse = {
    user_name: userName
  };

  const idmUpdateResponse = {
    update: true
  };

  const crmResponse = {
    entity_id: entityId
  };

  const createRequest = () => {
    return {
      yar: {
        set: sandbox.stub(),
        get: sandbox.stub(),
        reset: sandbox.stub()
      },
      cookieAuth: {
        set: sandbox.stub(),
        clear: sandbox.stub()
      },
      info: {
        remoteAddress: '127.0.0.1'
      }
    };
  };

  const createUser = (withEntity = true) => {
    const user = {
      user_id: userId,
      user_name: userName,
      role: {
        scopes: ['internal', 'returns']
      }
    };
    if (withEntity) {
      user.external_id = entityId;
    }
    return user;
  };

  beforeEach(async () => {
    connectors = {
      idm: {
        users: {
          authenticate: sandbox.stub().resolves(idmAuthResponse),
          updateExternalId: sandbox.stub().resolves(idmUpdateResponse),
          findOne: sandbox.stub().resolves({
            error: null,
            data: createUser()
          })
        }
      },
      crm: {
        entities: {
          getOrCreateIndividual: sandbox.stub().resolves(crmResponse)
        }
      }
    };
    authConfig = new AuthConfig(config, connectors);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('authenticate method', () => {
    test('provides correct arguments to IDM connector authenticate method', async () => {
      await authConfig.authenticate(userName, password);
      const [email, psw, app] = connectors.idm.users.authenticate.lastCall.args;
      expect(email).to.equal(userName);
      expect(psw).to.equal(password);
      expect(app).to.equal(config.idm.application);
    });

    test('resolves with response from IDM', async () => {
      const result = await authConfig.authenticate(userName, password);
      expect(result).to.equal(idmAuthResponse);
    });
  });

  experiment('signIn method', () => {
    let request, user;

    beforeEach(async () => {
      request = createRequest();
      user = createUser();
      await authConfig.signIn(request, user);
    });
    test('sets up cookie correctly', async () => {
      expect(request.cookieAuth.set.calledWith({ userId: user.user_id })).to.equal(true);
    });

    test('sets a CSRF token in the session', async () => {
      const [key, value] = request.yar.set.firstCall.args;
      expect(key).to.equal('csrfToken');
      expect(value).to.be.a.string();
      expect(value).to.have.length(36);
    });

    test('resets the session to prevent an login to an older session', async () => {
      expect(request.yar.reset.called).to.be.true();
    });

    test('sets user ID in the session', async () => {
      expect(request.yar.set.calledWith('userId', user.user_id)).to.equal(true);
    });

    test('sets IP address in the session', async () => {
      expect(request.yar.set.calledWith('ip', request.info.remoteAddress)).to.equal(true);
    });

    experiment('when IDM user has external_id', async () => {
      test('does not create a CRM entity', async () => {
        expect(connectors.crm.entities.getOrCreateIndividual.callCount).to.equal(0);
      });

      test('does not update the IDM user with CRM entity ID', async () => {
        expect(connectors.idm.users.updateExternalId.callCount).to.equal(0);
      });
    });

    experiment('when IDM user does not have external_id', async () => {
      beforeEach(async () => {
        user = createUser(false);
        request = createRequest();
        await authConfig.signIn(request, user);
      });

      test('creates a CRM entity', async () => {
        expect(connectors.crm.entities.getOrCreateIndividual.calledWith(userName)).to.equal(true);
      });

      test('updates the IDM user with CRM entity ID', async () => {
        expect(connectors.idm.users.updateExternalId.calledWith(user, entityId)).to.equal(true);
      });
    });
  });

  experiment('signOut', () => {
    let request;
    beforeEach(async () => {
      request = createRequest();
      authConfig.signOut(request);
    });

    test('clears cookie', async () => {
      expect(request.cookieAuth.clear.callCount).to.equal(1);
    });

    test('resets the session', async () => {
      expect(request.yar.reset.callCount).to.equal(1);
    });
  });

  experiment('validateFunc', () => {
    let request;

    beforeEach(async () => {
      request = createRequest();
    });

    test('user is not authenticated if no user ID in cookie', async () => {
      const { valid } = await authConfig.validateFunc(request, {});
      expect(valid).to.equal(false);
    });

    test('user is not authenticated if no user ID in session', async () => {
      const { valid } = await authConfig.validateFunc(request, { userId });
      expect(valid).to.equal(false);
    });

    test('user is not authenticated if user ID in session does match that in cookie', async () => {
      request.yar.get.returns('scary-imposter');
      const { valid } = await authConfig.validateFunc(request, { userId });
      expect(valid).to.equal(false);
    });

    test('user is authenticated user ID in session matches that in cookie', async () => {
      request.yar.get.returns(userId);
      const { valid } = await authConfig.validateFunc(request, { userId });
      expect(valid).to.equal(true);
    });

    experiment('when the IDM resolves with a user', () => {
      let user;

      beforeEach(async () => {
        user = createUser();
        request.yar.get.returns(userId);
        connectors.idm.users.findOne.resolves({ error: null, data: user });
      });

      test('credentials returned include user ID and scope', async () => {
        const { credentials } = await authConfig.validateFunc(request, { userId });
        expect(credentials.userId).to.equal(userId);
        expect(credentials.scope).to.equal(user.role.scopes);
      });

      test('sets data in the request.defra object', async () => {
        connectors.idm.users.findOne.resolves({ error: null, data: user });
        await authConfig.validateFunc(request, { userId });
        expect(request.defra.userId).to.equal(userId);
        expect(request.defra.userName).to.equal(user.user_name);
        expect(request.defra.user).to.equal(user);
        expect(request.defra.entityId).to.equal(entityId);
        expect(request.defra.userScopes).to.equal(user.role.scopes);
      });
    });

    test('rejects if the IDM throws an error', async () => {
      request.yar.get.returns(userId);
      connectors.idm.users.findOne.throws();
      const func = () => authConfig.validateFunc(request, { userId });
      expect(func()).to.reject();
    });

    test('rejects if the IDM resolves an error response', async () => {
      request.yar.get.returns(userId);
      connectors.idm.users.findOne.resolves({ error: 'Oops' });
      const func = () => authConfig.validateFunc(request, { userId });
      expect(func()).to.reject();
    });
  });
});
