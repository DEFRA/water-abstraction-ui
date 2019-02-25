const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();

const Hapi = require('hapi');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const crmDocumentConnector = require('../../../src/lib/connectors/crm/documents');
const routes = require('../../../src/modules/add-licences/routes');
const licenceLoaderPlugin = require('../../../src/lib/hapi-plugins/licence-loader');
const viewContextPlugin = require('../../../src/lib/hapi-plugins/view-context');
const requestStubPlugin = require('../../lib/hapi-plugins/request-stub-plugin');
const { scope } = require('../../../src/lib/constants');

const { set } = require('lodash');

const getRequestSetupForAuthenticatedUser = request => {
  set(request, 'auth.isAuthenticated', true);
  set(request, 'auth.credentials.entity_id', '123');
  set(request, 'auth.credentials.companyId', '456');
  set(request, 'state.sid', 'something');
  set(request, 'auth.credentials.scope', [
    scope.licenceHolder
  ]);
};

/**
 * Creates a test server with as few dependencies as possible
 * to allow the testing of the output view context/
 */
const getServer = async () => {
  const server = Hapi.server();
  server.decorate('toolkit', 'view', sandbox.stub().resolves('testing'));
  await server.register([
    {
      plugin: requestStubPlugin,
      options: { onPostAuth: getRequestSetupForAuthenticatedUser }
    },
    { plugin: licenceLoaderPlugin },
    { plugin: viewContextPlugin }
  ]);

  server.route(Object.values(routes));

  return server;
};

experiment('getSecurityCode', () => {
  let request;

  beforeEach(async () => {
    sandbox.stub(crmDocumentConnector, 'getLicenceCount');
    request = {
      method: 'GET',
      url: '/security-code'
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('when the user has already got licences all main nav links are shown', async () => {
    crmDocumentConnector.getLicenceCount.resolves(1);
    const server = await getServer();
    const response = await server.inject(request);
    const mainNavLinks = response.request.view.mainNavLinks;
    expect(mainNavLinks.length).to.equal(3);
  });

  test('when the user has no licences only the first link is shown', async () => {
    crmDocumentConnector.getLicenceCount.resolves(0);
    const server = await getServer();
    const response = await server.inject(request);
    const mainNavLinks = response.request.view.mainNavLinks;
    expect(mainNavLinks.length).to.equal(1);
    expect(mainNavLinks[0].id).to.equal('view');
  });
});
