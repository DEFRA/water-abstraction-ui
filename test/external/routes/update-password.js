'use strict';

const { experiment, test } = exports.lab = require('lab').script();
const { expect } = require('code');
const { createServer } = require('../server-factory');
const routes = require('shared/plugins/update-password/routes');

experiment('Check signin', () => {
  test('The page should have a links', async () => {
    const url = '/update_password';
    const method = 'GET';

    const route = routes.find(r => {
      return r.method === method && r.path === url;
    });

    const server = await createServer();
    server.route(route);

    const request = { method, url };

    const res = await server.inject(request);
    expect(res.statusCode).to.equal(200);
  });
});
