const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const AuthConfig = require('external/lib/AuthConfig');
const logingHelpers = require('external/lib/login-helpers');
const { logger } = require('external/logger');

const config = { idm: { application: 'water_test' } };

const entityRoles = [
  { company_entity_id: 'entity-id-1' },
  { company_entity_id: 'entity-id-1' },
  { company_entity_id: 'entity-id-2' }
];

experiment('external/lib/AuthConfig', async () => {
  let authConfig, connectors, request, h;

  beforeEach(async () => {
    connectors = {
      crm: {
        entityRoles: {
          getEntityRoles: sandbox.stub().resolves(entityRoles)
        }
      }
    };
    authConfig = new AuthConfig(config, connectors);

    request = {
      response: {
        error: 'bad-error',
        message: 'very bad error occurred',
        statusCode: 500,
        stack: 'test error stack'
      },
      yar: {
        get: sandbox.stub()
      }
    };

    h = {
      metaRedirect: sandbox.stub(),
      redirect: sandbox.stub()
    };

    sandbox.stub(logingHelpers, 'preRedirectIfAuthenticated');
    sandbox.stub(logingHelpers, 'getLoginRedirectPath').returns('redirect-path');
    sandbox.stub(logger, 'info');
  });

  afterEach(async () => sandbox.restore());

  experiment('.ifAuthenticated', () => {
    test('calls loginHelpers.preRedirectIfAuthenticated with request & h', () => {
      authConfig.ifAuthenticated(request, h);
      expect(logingHelpers.preRedirectIfAuthenticated.calledWith(
        request, h
      )).to.be.true();
    });
  });

  experiment('.onSignIn', async () => {
    test('calls h.metaRedirect with output from loginHelpers.getLoginRedirectPath', async () => {
      const user = { user_id: 25, user_name: 'test@example.com' };
      await authConfig.onSignIn(request, h, user);
      expect(logingHelpers.getLoginRedirectPath.calledWith(
        request, user
      )).to.be.true();
      expect(h.metaRedirect.calledWith('redirect-path')).to.be.true();
    });
  });

  experiment('.onSignOut', () => {
    test('calls h.metaRedirect with expected path', () => {
      authConfig.onSignOut(request, h);
      expect(h.metaRedirect.calledWith('/signed-out?u=e')).to.be.true();
    });
  });

  experiment('.onUnauthorized', () => {
    test('logs error and calls h.redirect with expected path', () => {
      authConfig.onUnauthorized(request, h);

      expect(logger.info.calledWith(request.response)).to.be.true();
      expect(h.redirect.calledWith('/welcome')).to.be.true();
    });
  });

  experiment('._mapUserRequestData', async () => {
    experiment('user data', async () => {
      const user = {
        user_id: 'test-user-id',
        user_name: 'test@example.com',
        external_id: 'test-external-id',
        role: {
          scopes: ['test-scope']
        },
        last_login: '2018-05-03 12:34:56'
      };

      let userData;
      beforeEach(async () => {
        request.yar.get.withArgs('companyId').returns(entityRoles[0].company_entity_id);
        request.yar.get.withArgs('companyName').returns('test-company');

        userData = await authConfig._mapUserRequestData(request, user);
      });

      test('contains userId', async () => {
        expect(userData.userId).to.equal(user.user_id);
      });

      test('contains userName', async () => {
        expect(userData.userName).to.equal(user.user_name);
      });

      test('contains user', async () => {
        expect(userData.user).to.equal(user);
      });

      test('contains entityId', async () => {
        expect(userData.entityId).to.equal(user.external_id);
      });

      test('contains companyId', async () => {
        expect(userData.companyId).to.equal(entityRoles[0].company_entity_id);
      });

      test('contains companyName', async () => {
        expect(userData.companyName).to.equal('test-company');
      });

      test('contains entityRoles', async () => {
        expect(userData.entityRoles).to.equal(entityRoles);
      });

      test('contains companyIds - a unique list of company ids', async () => {
        const allCompanyIds = entityRoles.map(role => role.company_entity_id);
        // Does not include second element because it is a duplicate of the first
        expect(userData.companyIds).to.equal([allCompanyIds[0], allCompanyIds[2]]);
      });

      test('contains companyCount', async () => {
        expect(userData.companyCount).to.equal(2);
      });

      test('contains userScopes', async () => {
        expect(userData.userScopes).to.equal(user.role.scopes);
      });

      test('contains lastLogin', async () => {
        expect(userData.lastLogin).to.equal(user.last_login);
      });
    });
  });
});
