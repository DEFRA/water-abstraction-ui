const { cloneDeep } = require('lodash');
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const routes = require('external/modules/view-licences/routes');
const Hapi = require('@hapi/hapi');

experiment('modules/view-licences/routes', () => {
  experiment('getLicences', () => {
    let server;

    beforeEach(async () => {
      const route = cloneDeep(routes.getLicences);
      route.handler = () => 'ok';
      route.config.auth = false;

      server = Hapi.server();
      server.route(route);
    });

    experiment('/', () => {
      test('returns a 200 with no query params', async () => {
        const request = { method: 'get', url: '/licences' };
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(200);
      });

      test('returns a 200 with a _ga query param', async () => {
        const request = { method: 'get', url: '/licences?_ga=track-me' };
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(200);
      });

      test('has default sorting params', async () => {
        const request = { method: 'get', url: '/licences' };
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(200);
        expect(response.request.query).to.equal({
          sort: 'licenceNumber',
          direction: 1,
          page: 1
        });
      });

      test('can override default sorting params', async () => {
        const request = { method: 'get', url: '/licences?sort=name&direction=-1&page=2' };
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(200);
        expect(response.request.query).to.equal({
          sort: 'name',
          direction: -1,
          page: 2
        });
      });

      test('unexpected query params are not parsed into request.query', async () => {
        const request = { method: 'get', url: '/licences?_ga=track-me&cat=meow' };
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(200);
        expect(response.request.query).to.equal({
          sort: 'licenceNumber',
          direction: 1,
          page: 1
        });
      });

      test('adds config to load the user licence count', async () => {
        const plugins = routes.getLicences.config.plugins;
        expect(plugins.licenceLoader.loadUserLicenceCount).to.be.true();
      });

      test('adds config to load the outstanding verifications', async () => {
        const plugins = routes.getLicences.config.plugins;
        expect(plugins.licenceLoader.loadOutstandingVerifications).to.be.true();
      });
    });
  });
});
