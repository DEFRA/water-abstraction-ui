'use strict';
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const routes = require('../../../../src/internal/modules/account-entry/routes');
const controller = require('../../../../src/internal/modules/account-entry/controller');
const testHelpers = require('../../test-helpers');
const { v4: uuid } = require('uuid');

experiment('internal/modules/account-entry/routes', () => {
  experiment('.getSelectExistingAccount', () => {
    let server, request, url;

    beforeEach(async () => {
      server = testHelpers.getTestServer(routes.getSelectExistingAccount);
      request = {
        method: 'get'
      };
      url = '/account-entry/test-key/select-existing-account?q=search-query';
    });

    test('has the correct path', () => {
      expect(routes.getSelectExistingAccount.path)
        .to.equal('/account-entry/{key}/select-existing-account');
    });

    test('has the correct controller method', () => {
      expect(routes.getSelectExistingAccount.handler)
        .to.equal(controller.getSelectExistingAccount);
    });

    test('has the correct method', () => {
      expect(routes.getSelectExistingAccount.method)
        .to.equal('get');
    });

    test('responds with 200 status for a valid request', async () => {
      const response = await server.inject(url, request);
      expect(response.statusCode).to.equal(200);
    });

    test('can accept an optional form guid', async () => {
      url = `${url}&form=${uuid()}`;
      const response = await server.inject(url, request);
      expect(response.statusCode).to.equal(200);
    });

    test('responds with 400 status if the search query is omitted', async () => {
      url = '/account-entry/test-key/select-existing-account';
      const response = await server.inject(url, request);
      expect(response.statusCode).to.equal(400);
    });

    test('responds with 400 status if the search query is empty', async () => {
      url = '/account-entry/test-key/select-existing-account?q=';
      const response = await server.inject(url, request);
      expect(response.statusCode).to.equal(400);
    });
  });
});
