const hapi = require('@hapi/hapi');
const configPlugin = require('../../../../../src/shared/plugins/config');

const { experiment, test } = exports.lab = require('lab').script();
const { expect } = require('code');

const getRoute = () => ({
  method: 'GET',
  path: '/',
  handler: () => 'test response'
});

const request = {
  method: 'GET',
  url: '/'
};

experiment('config plugin', () => {
  test('adds an empty config object to the request if no settings passed', async () => {
    const server = new hapi.Server();
    server.route(getRoute());

    server.register(configPlugin);

    const response = await server.inject(request);

    expect(response.request.config).to.equal({});
  });

  test('adds config object to the request when passed', async () => {
    const server = new hapi.Server();
    const route = getRoute();
    route.options = {
      plugins: {
        config: {
          hello: 'world'
        }
      }
    };

    server.route(route);
    server.register(configPlugin);

    const response = await server.inject(request);

    expect(response.request.config).to.equal({ hello: 'world' });
  });
});
