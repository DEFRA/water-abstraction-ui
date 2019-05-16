const { expect } = require('code');
const { set } = require('lodash');
const { beforeEach, afterEach, experiment, test } = exports.lab = require('lab').script();
const sinon = require('sinon');

const { scope } = require('../../../../src/external/lib/constants');
const idmConnector = require('../../../../src/external/lib/connectors/idm');
const crmConnector = require('../../../../src/external/lib/connectors/crm');
const plugin = require('../../../../src/external/lib/hapi-plugins/auth-credentials');
const { logger } = require('../../../../src/external/logger');

const username = 'user_1';
const entityId = 'entity_1';
const companyId = 'company_1';

const responses = {
  error: {
    error: 'oh no!',
    data: null
  },
  idmInternal: {
    error: null,
    data: [{
      role: {
        scopes: [scope.internal]
      }
    }]
  },
  idmExternal: {
    error: null,
    data: [{
      role: {
        scopes: [scope.external]
      }
    }]
  },
  crmRoles: [{
    company_entity_id: companyId,
    role: 'foo'
  }, {
    company_entity_id: companyId,
    role: 'bar'
  }, {
    company_entity_id: 'company_2',
    role: 'baz'
  }]

};

const createRequest = () => {
  return {
    auth: {
      isAuthenticated: true,
      credentials: {
        username,
        entity_id: entityId
      }
    }
  };
};

const createRequestWithCompany = () => {
  const request = createRequest();
  set(request, 'auth.credentials.companyId', companyId);
  return request;
};

experiment('auth credentials plugin', async () => {
  test('is configured correctly', async () => {
    expect(plugin.register).to.be.a.function();
    expect(plugin.pkg.name).to.equal('authCredentials');
    expect(plugin.pkg.version).to.equal('2.0.0');
  });

  test('registers an onCredentials handler', async () => {
    const server = {
      ext: sinon.stub()
    };
    plugin.register(server);
    expect(server.ext.callCount).to.equal(1);
    const { method, type } = server.ext.lastCall.args[0];
    expect(type).to.equal('onCredentials');
    expect(method).to.equal(plugin._handler);
  });
});

experiment('auth credentials plugin handler', async () => {
  let h;

  const sandbox = sinon.createSandbox();

  beforeEach(async () => {
    h = {
      continue: 'CONTINUE'
    };
    sandbox.stub(idmConnector, 'getUserByEmail');
    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('returns h.continue on unauthenticated routes', async () => {
    const result = await plugin._handler({
      auth: { isAuthenticated: false }
    }, h);
    expect(result).to.equal(h.continue);
  });

  test('throws and logs an error if there is an IDM error', async () => {
    const request = createRequest();
    idmConnector.getUserByEmail.resolves(responses.error);
    const func = () => plugin._handler(request, h);
    expect(func()).to.reject().then(() => {
      expect(logger.error.callCount).to.equal(1);
    });
  });

  experiment('for internal users', async () => {
    let request;
    let result;

    beforeEach(async () => {
      idmConnector.getUserByEmail.resolves(responses.idmInternal);
      request = createRequest();
      request.auth.credentials.companyId = companyId;
      result = await plugin._handler(request, h);
    });

    test('returns the scopes loaded from the IDM', async () => {
      expect(result).to.equal(h.continue);
      expect(request.auth.credentials.scope).to.equal([scope.internal]);
    });

    test('adds the user to the defra object', async () => {
      expect(request.defra.user).to.equal(responses.idmInternal.data[0]);
    });

    test('adds the userScopes to the defra object', async () => {
      expect(request.defra.userScopes).to.equal(['internal']);
    });

    test('adds the companyId to the defra object', async () => {
      expect(request.defra.companyId).to.equal(companyId);
    });
  });

  experiment('for external users', async () => {
    beforeEach(async () => {
      idmConnector.getUserByEmail.resolves(responses.idmExternal);
      sandbox.stub(crmConnector.entityRoles, 'setParams').returns({
        findAll: () => Promise.resolve(responses.crmRoles)
      });
    });

    test('places all user roles on the request', async () => {
      const request = createRequest();
      await plugin._handler(request, h);
      expect(request.defra.entityRoles).to.equal(responses.crmRoles);
    });

    test('does not place company roles in scope if no company selected', async () => {
      const request = createRequest();
      await plugin._handler(request, h);
      expect(request.auth.credentials.scope).to.equal([scope.external]);
    });

    test('places company roles in scope if company is selected', async () => {
      const request = createRequestWithCompany();
      const result = await plugin._handler(request, h);
      expect(result).to.equal(h.continue);
      expect(request.auth.credentials.scope).to.equal([scope.external, 'foo', 'bar']);
    });

    test('adds the user to the defra object', async () => {
      const request = createRequest();
      await plugin._handler(request, h);
      expect(request.defra.user).to.equal(responses.idmExternal.data[0]);
    });

    test('adds the companyId to the defra object', async () => {
      const request = createRequestWithCompany();
      await plugin._handler(request, h);
      expect(request.defra.companyId).to.equal(companyId);
    });

    test('adds the entityRoles to the defra object', async () => {
      const request = createRequestWithCompany();
      await plugin._handler(request, h);
      expect(request.defra.entityRoles).to.equal([
        { company_entity_id: 'company_1', role: 'foo' },
        { company_entity_id: 'company_1', role: 'bar' },
        { company_entity_id: 'company_2', role: 'baz' }
      ]);
    });

    test('adds the unique company ids to the defra object', async () => {
      const request = createRequestWithCompany();
      await plugin._handler(request, h);
      expect(request.defra.companyIds).to.equal(['company_1', 'company_2']);
    });

    test('adds the count of unique company ids to the defra object', async () => {
      const request = createRequestWithCompany();
      await plugin._handler(request, h);
      expect(request.defra.companyCount).to.equal(2);
    });

    test('adds the userScopes to the defra object', async () => {
      const request = createRequestWithCompany();
      await plugin._handler(request, h);
      expect(request.defra.userScopes).to.equal(['external', 'foo', 'bar']);
    });
  });
});
