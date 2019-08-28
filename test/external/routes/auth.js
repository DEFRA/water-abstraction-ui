'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const DOMParser = require('xmldom').DOMParser;

const { createServer } = require('../server-factory');
const routes = require('shared/plugins/auth/routes');

experiment('authentication routes', () => {
  experiment('GET /signin', () => {
    test('The page should have a links', async () => {
      const method = 'GET';
      const url = '/signin';
      const route = routes.find(r => r.path === url && r.method === method);

      const request = { method, url };

      const server = await createServer(route);

      const res = await server.inject(request);
      expect(res.statusCode).to.equal(200);

      const parser = new DOMParser();
      const doc = parser.parseFromString(res.payload, 'text/html');

      const elements = doc.getElementsByTagName('a');
      expect(elements).to.exist();
    });
  });

  experiment('GET /signout', () => {
    test('The page should have links', async () => {
      const method = 'GET';
      const url = '/signin';
      const request = { method, url };

      const route = routes.find(r => r.path === url && r.method === method);
      const server = await createServer(route);

      const res = await server.inject(request);
      expect(res.statusCode).to.equal(200);
    });
  });
});
