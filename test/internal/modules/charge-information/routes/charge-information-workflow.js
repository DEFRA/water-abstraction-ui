'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');

const preHandlers = require('internal/modules/charge-information/pre-handlers');
const routes = require('../../../../../src/internal/modules/charge-information/routes/charge-information-workflow');
const testHelpers = require('../../../test-helpers');

const uuid = require('uuid/v4');

experiment('internal/modules/charge-information/routes', () => {
  let server;
  experiment('getChargeInformationWorkflow', () => {
    beforeEach(async () => {
      testHelpers.getTestServer(routes.getChargeInformationWorkflow);
    });

    test('has the correct URL', async () => {
      expect(routes.getChargeInformationWorkflow.path).to.equal('/charge-information-workflow');
    });

    test('has the expected pre handlers', async () => {
      expect(routes.getChargeInformationWorkflow.options.pre[0].method).to.equal(preHandlers.loadChargeVersionWorkflows);
      expect(routes.getChargeInformationWorkflow.options.pre[0].assign).to.equal('chargeInformationWorkflows');
    });
  });

  experiment('getRemoveChargeInformationWorkflow', () => {
    beforeEach(async () => {
      server = testHelpers.getTestServer(routes.getRemoveChargeInformationWorkflow);
    });

    test('allows a uuid for the charge version workflow id', async () => {
      const request = {
        url: `/charge-information-workflow/${uuid()}/remove`
      };

      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the charge version workflow id', async () => {
      const request = {
        url: `/charge-information-workflow/non-uuid-charge-version-workflow-id/remove`
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('has the expected pre handlers', async () => {
      expect(routes.getRemoveChargeInformationWorkflow.options.pre[0].method).to.equal(preHandlers.loadChargeVersionWorkflow);
      expect(routes.getRemoveChargeInformationWorkflow.options.pre[0].assign).to.equal('chargeInformationWorkflow');
    });
  });

  experiment('postRemoveChargeInformationWorkflow', () => {
    beforeEach(async () => {
      server = testHelpers.getTestServer(routes.postRemoveChargeInformationWorkflow);
    });

    test('allows a uuid for the charge version workflow id', async () => {
      const request = {
        method: 'post',
        url: `/charge-information-workflow/${uuid()}/remove`
      };

      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the charge version workflow id', async () => {
      const request = {
        method: 'post',
        url: `/charge-information-workflow/non-uuid-charge-version-workflow-id/remove`
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });
});
