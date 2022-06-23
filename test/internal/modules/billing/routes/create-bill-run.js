'use strict';

const Hapi = require('@hapi/hapi');
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { cloneDeep } = require('lodash');
const sandbox = require('sinon').createSandbox();
const preHandlers = require('internal/modules/billing/pre-handlers');
const { scope } = require('internal/lib/constants');
const routes = require('internal/modules/billing/routes/create-bill-run');
const services = require('internal/lib/connectors/services');

const getServer = route => {
  const server = Hapi.server();

  const testRoute = cloneDeep(route);
  testRoute.handler = (req, h) => h.response('Test handler').code(200);
  testRoute.config.auth = false;
  server.route(testRoute);
  return server;
};

experiment('internal/modules/billing/routes', () => {
  beforeEach(async () => {
    sandbox.stub(services.water.regions, 'getRegions').resolves({ data: [] });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getBillingBatchType', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getBillingBatchType.config.auth.scope)
        .to.only.include([scope.billing]);
    });
  });

  experiment('.postBillingBatchType', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.postBillingBatchType.config.auth.scope)
        .to.only.include([scope.billing]);
    });
  });

  experiment('.getBillingBatchRegion', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getBillingBatchRegion.config.auth.scope)
        .to.only.include([scope.billing]);
    });

    test('accepts the season at the end of the path', async () => {
      const server = getServer(routes.getBillingBatchRegion);
      const request = {
        url: '/billing/batch/region/two-part-tariff/summer'
      };

      const response = await server.inject(request);

      expect(response.payload).to.equal('Test handler');
    });

    test('works without the season at the end of the path', async () => {
      const server = getServer(routes.getBillingBatchRegion);
      const request = {
        url: '/billing/batch/region/annual'
      };

      const response = await server.inject(request);

      expect(response.payload).to.equal('Test handler');
    });
  });

  experiment('.postBillingBatchRegion', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.postBillingBatchRegion.config.auth.scope)
        .to.only.include([scope.billing]);
    });
  });

  experiment('.getBillingBatchExists', () => {
    const route = routes.getBillingBatchExists;
    test('limits scope to users with billing role', async () => {
      expect(route.config.auth.scope)
        .to.only.include([scope.billing]);
    });

    test('uses a pre handler to load the batch', async () => {
      expect(route.config.pre).to.have.length(1);
      expect(route.config.pre[0].method).to.equal(preHandlers.loadBatch);
      expect(route.config.pre[0].assign).to.equal('batch');
    });
  });

  experiment('.getBillingBatchDuplicate', () => {
    const route = routes.getBillingBatchExists;
    test('limits scope to users with billing role', async () => {
      expect(route.config.auth.scope)
        .to.only.include([scope.billing]);
    });

    test('uses a pre handler to load the batch', async () => {
      expect(route.config.pre).to.have.length(1);
      expect(route.config.pre[0].method).to.equal(preHandlers.loadBatch);
      expect(route.config.pre[0].assign).to.equal('batch');
    });
  });

  experiment('.postBillingFinancialYear', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.postBillingFinancialYear.config.auth.scope)
        .to.only.include([scope.billing]);
    });
  });

  experiment('.getBillingBatchFinancialYear', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getBillingBatchFinancialYear.config.auth.scope)
        .to.only.include([scope.billing]);
    });
  });
});
