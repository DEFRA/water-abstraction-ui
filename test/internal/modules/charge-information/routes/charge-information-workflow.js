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

experiment('internal/modules/charge-information/routes', () => {
  experiment('getChargeInformationWorkflow', () => {
    beforeEach(async () => {
      testHelpers.getTestServer(routes.getChargeInformationWorkflow);
    });

    test('has the correct URL', async () => {
      expect(routes.getChargeInformationWorkflow.path).to.equal('/charge-information-workflow');
    });

    test('has the expected pre handlers', async () => {
      expect(routes.getChargeInformationWorkflow.options.pre[0].method).to.equal(preHandlers.loadLicencesWithoutChargeVersions);
      expect(routes.getChargeInformationWorkflow.options.pre[0].assign).to.equal('toSetUp');
      expect(routes.getChargeInformationWorkflow.options.pre[1].method).to.equal(preHandlers.loadLicencesWithWorkflowsInProgress);
      expect(routes.getChargeInformationWorkflow.options.pre[1].assign).to.equal('inProgress');
    });
  });
});
