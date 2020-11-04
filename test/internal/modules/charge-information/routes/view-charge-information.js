'use strict';
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const preHandlers = require('internal/modules/charge-information/pre-handlers');
const routes = require('internal/modules/charge-information/routes/view-charge-information');
const testHelpers = require('../../../test-helpers');

experiment('internal/modules/charge-information/routes/view-charge-information', () => {
  let server;
  const licenceId = uuid();

  experiment('getViewChargeInformation', () => {
    beforeEach(async () => {
      server = testHelpers.getTestServer(routes.getViewChargeInformation);
    });

    test('allows a uuid for the licence id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/${uuid()}/view`
      };

      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/test-non-uuid-licence-id/charge-information/${uuid()}/view`
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('allows a uuid for the charge version id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/${uuid()}/view`
      };

      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/test-charge-version-id/view`
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('has the expected pre handlers', async () => {
      expect(routes.getViewChargeInformation.options.pre.length).to.equal(2);
      expect(routes.getViewChargeInformation.options.pre[0].method).to.equal(preHandlers.loadLicence);
      expect(routes.getViewChargeInformation.options.pre[0].assign).to.equal('licence');
      expect(routes.getViewChargeInformation.options.pre[1].method).to.equal(preHandlers.loadChargeVersion);
      expect(routes.getViewChargeInformation.options.pre[1].assign).to.equal('chargeVersion');
    });
  });

  experiment('getReviewChargeInformation', () => {
    beforeEach(async () => {
      server = testHelpers.getTestServer(routes.getReviewChargeInformation);
    });

    test('allows a uuid for the licence id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/${uuid()}/review`
      };

      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/test-non-uuid-licence-id/charge-information/${uuid()}/review`
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('allows a uuid for the charge version workflow id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/${uuid()}/review`
      };

      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/test-charge-version-workflow-id/review`
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('has the expected pre handlers', async () => {
      expect(routes.getReviewChargeInformation.options.pre.length).to.equal(3);
      expect(routes.getReviewChargeInformation.options.pre[0].method).to.equal(preHandlers.loadLicence);
      expect(routes.getReviewChargeInformation.options.pre[0].assign).to.equal('licence');
      expect(routes.getReviewChargeInformation.options.pre[1].method).to.equal(preHandlers.loadChargeVersionWorkflow);
      expect(routes.getReviewChargeInformation.options.pre[1].assign).to.equal('draftChargeInformation');
      expect(routes.getReviewChargeInformation.options.pre[2].method).to.equal(preHandlers.loadIsChargeable);
      expect(routes.getReviewChargeInformation.options.pre[2].assign).to.equal('isChargeable');
    });
  });
});
