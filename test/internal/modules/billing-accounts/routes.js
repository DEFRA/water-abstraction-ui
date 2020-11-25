'use strict';
const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const testHelpers = require('../../test-helpers');
const uuid = require('uuid/v4');

const { scope } = require('internal/lib/constants');
const preHandlers = require('internal/modules/billing-accounts/pre-handlers');

const routes = require('internal/modules/billing-accounts/routes');
const controller = require('internal/modules/billing-accounts/controller');

experiment('internal/modules/billing-accounts/routes', () => {
  let billingAccountId, server;

  experiment('.getBillingAccount', () => {
    beforeEach(async () => {
      billingAccountId = uuid();
      server = testHelpers.getTestServer(routes.getBillingAccount);
    });

    test('allows a uuid for the billing account id', async () => {
      const request = {
        url: `/billing-accounts/${billingAccountId}`
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/billing-accounts/test-non-uuid-licence-id`
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('allows a back link to be specified', async () => {
      const request = {
        url: `/billing-accounts/${billingAccountId}?back=/back-link`
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('limits scope to users with billing role', async () => {
      expect(routes.getBillingAccount.options.auth.scope)
        .to.only.include([scope.manageBillingAccounts]);
    });

    test('uses the correct handler', async () => {
      expect(routes.getBillingAccount.handler).to.equal(controller.getBillingAccount);
    });

    test('uses the loadBillingAccount pre handler', async () => {
      expect(routes.getBillingAccount.options.pre[0].method)
        .to.equal(preHandlers.loadBillingAccount);
    });

    test('saves billing account to expected place', async () => {
      expect(routes.getBillingAccount.options.pre[0].assign)
        .to.equal('billingAccount');
    });
  });
});
