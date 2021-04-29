'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const routes = require('shared/plugins/cookie-message/routes');

const { createServer, createRouteWithNoOpHandler } = require('../../../lib/server-factory');

experiment('internal/shared/plugins/cookie-message/routes', () => {
  let request, server;

  const testPaths = () => {
    test('200 response for a valid redirect path', async () => {
      request.url += '?redirectPath=/login';
      const res = await server.inject(request);
      expect(res.statusCode).to.equal(200);
    });

    test('400 response for a path not beginning with /', async () => {
      request.url += '?redirectPath=login';
      const res = await server.inject(request);
      expect(res.statusCode).to.equal(400);
    });

    test('200 response for a valid redirect path with query params', async () => {
      request.url += '?redirectPath=/login%3Dpage=2';
      const res = await server.inject(request);
      expect(res.statusCode).to.equal(200);
    });

    test('400 response for a non-relative path', async () => {
      request.url += '?redirectPath=https://example.com';
      const res = await server.inject(request);
      expect(res.statusCode).to.equal(400);
    });

    test('400 response for a path with no protocol', async () => {
      request.url += '?redirectPath=//example.com';
      const res = await server.inject(request);
      expect(res.statusCode).to.equal(400);
    });
  };

  experiment(`get /cookies`, () => {
    beforeEach(async () => {
      request = {
        method: 'get',
        url: 'http://localhost/cookies'
      };

      server = await createServer(
        createRouteWithNoOpHandler(routes.getCookies)
      );
    });

    testPaths();
  });

  experiment(`post /cookies`, () => {
    beforeEach(async () => {
      request = {
        method: 'post',
        url: 'http://localhost/cookies'
      };

      server = await createServer(
        createRouteWithNoOpHandler(routes.postCookies)
      );
    });

    testPaths();
  });

  experiment(`get /set-cookie-preferences`, () => {
    beforeEach(async () => {
      request = {
        method: 'get',
        url: 'http://localhost/set-cookie-preferences'
      };

      server = await createServer(
        createRouteWithNoOpHandler(routes.getSetCookiePreferences)
      );
    });

    testPaths();
  });
});
