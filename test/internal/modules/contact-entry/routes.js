'use strict';
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const routes = require('../../../../src/internal/modules/contact-entry/routes');
const controllers = require('../../../../src/internal/modules/contact-entry/controllers');
const testHelpers = require('../../test-helpers');
const uuid = require('uuid');
const queryString = require('querystring');

experiment('internal/modules/invoice-accounts/routes', () => {
  experiment('.getSelectContact', () => {
    let server;

    beforeEach(async () => {
      server = testHelpers.getTestServer(routes.getSelectContact);
    });

    test('has the correct path', () => {
      expect(routes.getSelectContact.path)
        .to.equal('/contact-entry/select-contact');
    });

    test('has the correct controller', () => {
      expect(routes.getSelectContact.handler)
        .to.equal(controllers.getSelectContactController);
    });

    test('has the correct method', () => {
      expect(routes.getSelectContact.method)
        .to.equal('GET');
    });

    test('does not allow a non uuid for the session key', async () => {
      const queryTail = queryString.stringify({
        back: 'somewhere else',
        searchQuery: 'Test',
        regionId: uuid(),
        originalCompanyId: uuid(),
        sessionKey: 'some key which clearly is not a uuid'
      });

      let url = `/contact-entry/select-contact?${queryTail}`;

      const response = await server.inject(url, { method: 'GET' });
      expect(response.statusCode).to.equal(400);
    });

    test('does not allow a the searchQuery to be null', async () => {
      const queryTail = queryString.stringify({
        back: 'somewhere else',
        searchQuery: null,
        regionId: uuid(),
        originalCompanyId: uuid(),
        sessionKey: uuid()
      });

      let url = `/contact-entry/select-contact?${queryTail}`;

      const response = await server.inject(url, { method: 'GET' });
      expect(response.statusCode).to.equal(400);
    });

    test('responds with 200 if the query parameters are valid', async () => {
      const queryTail = queryString.stringify({
        sessionKey: uuid(),
        back: 'somewhere else',
        searchQuery: 'a non-null value',
        regionId: uuid(),
        originalCompanyId: uuid()
      });

      let url = `/contact-entry/select-contact?${queryTail}`;

      const response = await server.inject(url, { method: 'GET' });
      console.log(response);
      expect(response.statusCode).to.equal(200);
    });
  });

  experiment('.postSelectContact', () => {
    test('has the correct method', () => {
      expect(routes.postSelectContact.method)
        .to.equal('POST');
    });

    test('has the correct path', () => {
      expect(routes.postSelectContact.path)
        .to.equal('/contact-entry/select-contact');
    });

    test('has the correct controller', () => {
      expect(routes.postSelectContact.handler)
        .to.equal(controllers.postSelectContactController);
    });
  });

  experiment('.getSelectAccountType', () => {
    let server;

    beforeEach(async () => {
      server = testHelpers.getTestServer(routes.getSelectAccountType);
    });

    test('has the correct method', () => {
      expect(routes.getSelectAccountType.method)
        .to.equal('GET');
    });

    test('has the correct path', () => {
      expect(routes.getSelectAccountType.path)
        .to.equal('/contact-entry/new/account-type');
    });

    test('has the correct controller', () => {
      expect(routes.getSelectAccountType.handler)
        .to.equal(controllers.getSelectAccountTypeController);
    });

    test('does not allow a non uuid for the session key', async () => {
      const queryTail = queryString.stringify({
        sessionKey: 'some key which clearly is not a uuid'
      });

      let url = `/contact-entry/new/account-type?${queryTail}`;

      const response = await server.inject(url, { method: 'GET' });
      expect(response.statusCode).to.equal(400);
    });
  });

  experiment('.postSelectAccountType', () => {
    test('has the correct method', () => {
      expect(routes.postSelectAccountType.method)
        .to.equal('POST');
    });

    test('has the correct path', () => {
      expect(routes.postSelectAccountType.path)
        .to.equal('/contact-entry/new/account-type');
    });

    test('has the correct controller', () => {
      expect(routes.postSelectAccountType.handler)
        .to.equal(controllers.postSelectAccountTypeController);
    });
  });

  experiment('.getEnterNewDetails', () => {
    test('has the correct method', () => {
      expect(routes.getEnterNewDetails.method)
        .to.equal('GET');
    });

    test('has the correct path', () => {
      expect(routes.getEnterNewDetails.path)
        .to.equal('/contact-entry/new/details');
    });

    test('has the correct controller', () => {
      expect(routes.getEnterNewDetails.handler)
        .to.equal(controllers.postDetailsController);
    });
  });

  experiment('.postSelectAccountType', () => {
    test('has the correct method', () => {
      expect(routes.postSelectAccountType.method)
        .to.equal('POST');
    });

    test('has the correct path', () => {
      expect(routes.postSelectAccountType.path)
        .to.equal('/contact-entry/new/account-type');
    });

    test('has the correct controller', () => {
      expect(routes.postSelectAccountType.handler)
        .to.equal(controllers.postSelectAccountTypeController);
    });
  });
});
