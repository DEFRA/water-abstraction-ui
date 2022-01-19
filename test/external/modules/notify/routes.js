const { cloneDeep } = require('lodash');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const Hapi = require('@hapi/hapi');
const { v4: uuid } = require('uuid');
const sandbox = require('sinon').createSandbox();

const routes = require('external/modules/notify/routes');
const controller = require('external/modules/notify/controller');

experiment('external/modules/notify/routes', () => {
  beforeEach(async () => {

  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.notifyCallback', () => {
    let server;
    const request = {
      method: 'POST',
      url: '/notify/callback',
      headers: { authorization: 'Bearer test' },
      payload: {}
    };

    beforeEach(async () => {
      const route = cloneDeep(routes.notifyCallback);
      route.handler = () => 'ok';
      route.config.auth = false;

      server = Hapi.server();
      server.route(route);
    });

    experiment('/', () => {
      test('validates the id must be a uuid', async () => {
        request.payload.id = 'yada-yada';
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(400);
      });

      test('validates the reference must be a uuid', async () => {
        request.payload.reference = 'yada-yada';
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(400);
      });

      test('accepts a valid payload', async () => {
        request.payload.id = await uuid();
        request.payload.reference = await uuid();
        const output = await server.inject(request);
        expect(output.statusCode).to.equal(200);
      });

      test('has the correct method', () => {
        expect(routes.notifyCallback.method).to.equal('POST');
      });

      test('has the correct controller', () => {
        expect(routes.notifyCallback.handler).to.equal(controller.callback);
      });

      test('has the correct path', () => {
        expect(routes.notifyCallback.path).endsWith('/notify/callback');
      });
    });
  });
});
