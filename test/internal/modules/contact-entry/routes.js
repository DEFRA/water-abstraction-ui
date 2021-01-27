'use strict';
const { expect } = require('@hapi/code');
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const { scope } = require('internal/lib/constants');
const routes = require('internal/modules/contact-entry/routes');
const preHandlers = require('internal/modules/contact-entry/pre-handlers');

experiment('internal/modules/contact-entry/routes', () => {
  ['get', 'post'].forEach(method => {
    experiment(`.${method}SelectContact`, () => {
      const route = `${method}SelectContact`;
      test('limits scope to users with charges role', async () => {
        expect(routes[route].options.auth.scope)
          .to.only.include([scope.charging]);
      });

      test('uses the getSessionData pre handler', async () => {
        expect(routes[route].options.pre[0].method)
          .to.equal(preHandlers.getSessionData);
      });

      test('saves session data to expected place', async () => {
        expect(routes[route].options.pre[0].assign)
          .to.equal('sessionData');
      });

      test('uses the loadCompany pre handler', async () => {
        expect(routes[route].options.pre[1].method)
          .to.equal(preHandlers.loadCompany);
      });

      test('saves company to expected place', async () => {
        expect(routes[route].options.pre[1].assign)
          .to.equal('company');
      });

      test('uses the loadCompanyContacts pre handler', async () => {
        expect(routes[route].options.pre[2].method)
          .to.equal(preHandlers.loadCompanyContacts);
      });

      test('saves company contacts to expected place', async () => {
        expect(routes[route].options.pre[2].assign)
          .to.equal('companyContacts');
      });
    });

    experiment(`.${method}CreateContact`, () => {
      const route = `${method}CreateContact`;
      test('limits scope to users with charges role', async () => {
        expect(routes[route].options.auth.scope)
          .to.only.include([scope.charging]);
      });

      test('uses the getSessionData pre handler', async () => {
        expect(routes[route].options.pre[0].method)
          .to.equal(preHandlers.getSessionData);
      });

      test('saves session data to expected place', async () => {
        expect(routes[route].options.pre[0].assign)
          .to.equal('sessionData');
      });

      test('uses the loadCompany pre handler', async () => {
        expect(routes[route].options.pre[1].method)
          .to.equal(preHandlers.loadCompany);
      });

      test('saves company to expected place', async () => {
        expect(routes[route].options.pre[1].assign)
          .to.equal('company');
      });
    });
  });
});
