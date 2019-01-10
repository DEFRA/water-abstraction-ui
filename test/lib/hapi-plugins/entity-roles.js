const Hapi = require('hapi');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('code');
const {
  beforeEach,
  afterEach,
  experiment,
  test } = exports.lab = require('lab').script();

const requestStubPlugin = require('./request-stub-plugin');

const crmConnector = require('../../../src/lib/connectors/crm');
const entityRolesPlugin = require('../../../src/lib/hapi-plugins/entity-roles');

const getServer = async (requestStubFn = () => {}) => {
  const server = Hapi.server();
  await server.register([
    {
      plugin: requestStubPlugin,
      options: { setupRequest: requestStubFn }
    },
    {
      plugin: entityRolesPlugin
    }
  ]);

  server.route({
    method: 'GET',
    path: '/',
    handler: () => 'ok'
  });

  return server;
};

// This function will be passed to the requestStubPlugin to update the
// request object before the entityRoles plugin is called.
//
// This function sets up the request so the user appears to be logged in
// and has a given entity id.
const getRequestSetupForAuthenticatedUser = request => {
  request.auth = {
    isAuthenticated: true,
    credentials: {
      entity_id: '123'
    }
  };
};

experiment('entityRolesPlugin', () => {
  beforeEach(async () => {
    sandbox.stub(crmConnector.entityRoles, 'setParams').returns({
      findMany: sinon.stub().resolves({
        error: null,
        data: [{ id: 'role-1' }, { id: 'role-2' }]
      })
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('gets the roles using the expected entity id from the request', async () => {
    const server = await getServer(getRequestSetupForAuthenticatedUser);
    const request = { url: '/' };

    await server.inject(request);

    expect(crmConnector.entityRoles.setParams.args[0][0]).to.equal({ entityId: '123' });
  });

  test('the entity roles are assigned to the request', async () => {
    const server = await getServer(getRequestSetupForAuthenticatedUser);
    const request = { url: '/' };

    const response = await server.inject(request);

    expect(response.request.entityRoles).to.equal([
      { id: 'role-1' },
      { id: 'role-2' }
    ]);
  });
});
