'use strict';
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const routes = require('../../../../src/internal/modules/contact-entry/routes');
const controllers = require('../../../../src/internal/modules/contact-entry/controllers');
const testHelpers = require('../../test-helpers');
const uuid = require('uuid');
const queryString = require('querystring');

experiment('internal/modules/contact-entry/routes', () => {
  experiment('.getNew', () => {
    let server;

    beforeEach(async () => {
      server = testHelpers.getTestServer(routes.getNew);
    });

    test('has the correct path', () => {
      expect(routes.getNew.path)
        .to.equal('/contact-entry/new');
    });

    test('has the correct controller', () => {
      expect(routes.getNew.handler)
        .to.equal(controllers.getNew);
    });

    test('has the correct method', () => {
      expect(routes.getNew.method)
        .to.equal('GET');
    });

    test('does not allow a non uuid for the session key', async () => {
      const queryTail = queryString.stringify({
        back: 'somewhere else',
        searchQuery: 'Test',
        sessionKey: 'some key which clearly is not a uuid'
      });

      let url = `/contact-entry/new?${queryTail}`;

      const response = await server.inject(url, { method: 'GET' });
      expect(response.statusCode).to.equal(400);
    });

    test('does not allow a the searchQuery to be null', async () => {
      const queryTail = queryString.stringify({
        redirectPath: 'somewhere else',
        back: 'some other place',
        searchQuery: null,
        sessionKey: uuid()
      });

      let url = `/contact-entry/new?${queryTail}`;

      const response = await server.inject(url, { method: 'GET' });
      expect(response.statusCode).to.equal(400);
    });

    test('responds with 200 if the query parameters are valid', async () => {
      const queryTail = queryString.stringify({
        sessionKey: uuid(),
        back: 'some other place',
        redirectPath: 'somewhere else',
        searchQuery: 'a non-null value'
      });

      let url = `/contact-entry/new?${queryTail}`;

      const response = await server.inject(url, { method: 'GET' });
      expect(response.statusCode).to.equal(200);
    });
  });

  experiment('.getSelectAccountType', () => {
    let server;

    beforeEach(async () => {
      server = testHelpers.getTestServer(routes.getSelectAccountType);
    });

    test('has the correct path', () => {
      expect(routes.getSelectAccountType.path)
        .to.equal('/contact-entry/new/account-type');
    });

    test('has the correct controller', () => {
      expect(routes.getSelectAccountType.handler)
        .to.equal(controllers.getSelectAccountTypeController);
    });

    test('has the correct method', () => {
      expect(routes.getSelectAccountType.method)
        .to.equal('GET');
    });

    test('does not allow a non uuid for the session key', async () => {
      const queryTail = queryString.stringify({
        sessionKey: 'some key which clearly is not a uuid'
      });

      let url = `/contact-entry/new/account-type?${queryTail}`;

      const response = await server.inject(url, { method: 'GET' });
      expect(response.statusCode).to.equal(400);
    });

    test('responds with 200 if the query parameters are valid', async () => {
      const queryTail = queryString.stringify({
        sessionKey: uuid(),
      });

      let url = `/contact-entry/new/account-type?${queryTail}`;

      const response = await server.inject(url, { method: 'GET' });
      expect(response.statusCode).to.equal(200);
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
        .to.equal(controllers.getDetailsController);
    });
  });

  experiment('.getAddressEntered', () => {
    test('has the correct method', () => {
      expect(routes.getAddressEntered.method)
        .to.equal('GET');
    });

    test('has the correct path', () => {
      expect(routes.getAddressEntered.path)
        .to.equal('/contact-entry/new/address-entered');
    });

    test('has the correct controller', () => {
      expect(routes.getAddressEntered.handler)
        .to.equal(controllers.getAddressEntered);
    });
  });

  experiment('.postCompanySearch', () => {
    test('has the correct method', () => {
      expect(routes.postCompanySearch.method)
        .to.equal('POST');
    });

    test('has the correct path', () => {
      expect(routes.postCompanySearch.path)
        .to.equal('/contact-entry/new/details/company-search');
    });

    test('has the correct controller', () => {
      expect(routes.postCompanySearch.handler)
        .to.equal(controllers.postCompanySearchController);
    });
  });

  experiment('.getSelectCompany', () => {
    test('has the correct method', () => {
      expect(routes.getSelectCompany.method)
        .to.equal('GET');
    });

    test('has the correct path', () => {
      expect(routes.getSelectCompany.path)
        .to.equal('/contact-entry/new/details/company-search/select-company');
    });

    test('has the correct controller', () => {
      expect(routes.getSelectCompany.handler)
        .to.equal(controllers.getSelectCompanyController);
    });
  });

  experiment('.postSelectCompany', () => {
    test('has the correct method', () => {
      expect(routes.postSelectCompany.method)
        .to.equal('POST');
    });

    test('has the correct path', () => {
      expect(routes.postSelectCompany.path)
        .to.equal('/contact-entry/new/details/company-search/select-company');
    });

    test('has the correct controller', () => {
      expect(routes.postSelectCompany.handler)
        .to.equal(controllers.postSelectCompanyController);
    });
  });

  experiment('.getSelectCompanyAddress', () => {
    test('has the correct method', () => {
      expect(routes.getSelectCompanyAddress.method)
        .to.equal('GET');
    });

    test('has the correct path', () => {
      expect(routes.getSelectCompanyAddress.path)
        .to.equal('/contact-entry/new/details/company-search/select-company-address');
    });

    test('has the correct controller', () => {
      expect(routes.getSelectCompanyAddress.handler)
        .to.equal(controllers.getSelectCompanyAddressController);
    });
  });

  experiment('.postSelectCompanyAddress', () => {
    test('has the correct method', () => {
      expect(routes.postSelectCompanyAddress.method)
        .to.equal('POST');
    });

    test('has the correct path', () => {
      expect(routes.postSelectCompanyAddress.path)
        .to.equal('/contact-entry/new/details/company-search/select-company-address');
    });

    test('has the correct controller', () => {
      expect(routes.postSelectCompanyAddress.handler)
        .to.equal(controllers.postSelectCompanyAddressController);
    });
  });
});