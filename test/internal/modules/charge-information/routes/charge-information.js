'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');

const preHandlers = require('internal/modules/charge-information/pre-handlers');
const routes = require('../../../../../src/internal/modules/charge-information/routes/charge-information');
const testHelpers = require('../../../test-helpers');

experiment('internal/modules/charge-information/routes', () => {
  let server;
  let licenceId;

  experiment('getReason', () => {
    beforeEach(async () => {
      licenceId = uuid();
      server = testHelpers.getTestServer(routes.getReason);
    });

    test('allows a uuid for the licence id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/create`
      };

      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/test-non-uuid-licence-id/charge-information/create`
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('has the expected pre handlers', async () => {
      expect(routes.getReason.options.pre[0].method).to.equal(preHandlers.loadDraftChargeInformation);
      expect(routes.getReason.options.pre[0].assign).to.equal('draftChargeInformation');
      expect(routes.getReason.options.pre[1].method).to.equal(preHandlers.loadLicence);
      expect(routes.getReason.options.pre[1].assign).to.equal('licence');
      expect(routes.getReason.options.pre[2].method).to.equal(preHandlers.loadChargeableChangeReasons);
      expect(routes.getReason.options.pre[2].assign).to.equal('changeReasons');
    });
  });

  experiment('postReason', () => {
    beforeEach(async () => {
      licenceId = uuid();
      server = testHelpers.getTestServer(routes.postReason);
    });

    test('allows a uuid for the licence id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/create`,
        method: 'POST'
      };

      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/test-non-uuid-licence-id/charge-information/create`,
        method: 'POST'
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('has the expected pre handlers', async () => {
      expect(routes.getReason.options.pre[0].method).to.equal(preHandlers.loadDraftChargeInformation);
      expect(routes.getReason.options.pre[0].assign).to.equal('draftChargeInformation');
      expect(routes.getReason.options.pre[1].method).to.equal(preHandlers.loadLicence);
      expect(routes.getReason.options.pre[1].assign).to.equal('licence');
      expect(routes.getReason.options.pre[2].method).to.equal(preHandlers.loadChargeableChangeReasons);
      expect(routes.getReason.options.pre[2].assign).to.equal('changeReasons');
    });
  });

  experiment('getStartDate', () => {
    beforeEach(async () => {
      licenceId = uuid();
      server = testHelpers.getTestServer(routes.getStartDate);
    });

    test('allows a uuid for the licence id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/start-date`
      };

      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/test-non-uuid-licence-id/charge-information/start-date`
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('has the expected pre handlers', async () => {
      expect(routes.getStartDate.options.pre[0].method).to.equal(preHandlers.loadDraftChargeInformation);
      expect(routes.getStartDate.options.pre[0].assign).to.equal('draftChargeInformation');
      expect(routes.getStartDate.options.pre[1].method).to.equal(preHandlers.loadLicence);
      expect(routes.getStartDate.options.pre[1].assign).to.equal('licence');
    });
  });

  experiment('postStartDate', () => {
    beforeEach(async () => {
      licenceId = uuid();
      server = testHelpers.getTestServer(routes.postStartDate);
    });

    test('allows a uuid for the licence id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/start-date`,
        method: 'POST'
      };

      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/test-non-uuid-licence-id/charge-information/start-date`,
        method: 'POST'
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('has the expected pre handlers', async () => {
      expect(routes.postStartDate.options.pre[0].method).to.equal(preHandlers.loadDraftChargeInformation);
      expect(routes.postStartDate.options.pre[1].method).to.equal(preHandlers.loadLicence);
      expect(routes.postStartDate.options.pre[1].assign).to.equal('licence');
    });
  });

  experiment('getUseAbstractionData', () => {
    beforeEach(async () => {
      licenceId = uuid();
      server = testHelpers.getTestServer(routes.getUseAbstractionData);
    });

    test('allows a uuid for the licence id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/use-abstraction-data`
      };

      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/test-non-uuid-licence-id/charge-information/use-abstraction-data`
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('has the expected pre handlers', async () => {
      expect(routes.getUseAbstractionData.options.pre[0].method).to.equal(preHandlers.loadDraftChargeInformation);
      expect(routes.getUseAbstractionData.options.pre[0].assign).to.equal('draftChargeInformation');
      expect(routes.getUseAbstractionData.options.pre[1].method).to.equal(preHandlers.loadChargeVersions);
      expect(routes.getUseAbstractionData.options.pre[1].assign).to.equal('chargeVersions');
      expect(routes.getUseAbstractionData.options.pre[2].method).to.equal(preHandlers.loadLicence);
      expect(routes.getUseAbstractionData.options.pre[2].assign).to.equal('licence');
    });
  });

  experiment('postUseAbstractionData', () => {
    beforeEach(async () => {
      licenceId = uuid();
      server = testHelpers.getTestServer(routes.postUseAbstractionData);
    });

    test('allows a uuid for the licence id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/use-abstraction-data`,
        method: 'POST'
      };

      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/test-non-uuid-licence-id/charge-information/use-abstraction-data`,
        method: 'POST'
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('has the expected pre handlers', async () => {
      expect(routes.postUseAbstractionData.options.pre[0].method).to.equal(preHandlers.loadDraftChargeInformation);
      expect(routes.postUseAbstractionData.options.pre[0].assign).to.equal('draftChargeInformation');
      expect(routes.postUseAbstractionData.options.pre[1].method).to.equal(preHandlers.loadLicence);
      expect(routes.postUseAbstractionData.options.pre[1].assign).to.equal('licence');
      expect(routes.postUseAbstractionData.options.pre[2].method).to.equal(preHandlers.loadDefaultCharges);
      expect(routes.postUseAbstractionData.options.pre[2].assign).to.equal('defaultCharges');
      expect(routes.postUseAbstractionData.options.pre[3].method).to.equal(preHandlers.loadChargeVersions);
      expect(routes.postUseAbstractionData.options.pre[3].assign).to.equal('chargeVersions');
    });
  });

  experiment('getCheckData', () => {
    beforeEach(async () => {
      licenceId = uuid();
      server = testHelpers.getTestServer(routes.getCheckData);
    });

    test('allows a uuid for the licence id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/check`
      };

      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/test-non-uuid-licence-id/charge-information/check`
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('has the expected pre handlers', async () => {
      expect(routes.getCheckData.options.pre[0].method).to.equal(preHandlers.loadBillingAccount);
      expect(routes.getCheckData.options.pre[0].assign).to.equal('billingAccount');
      expect(routes.getCheckData.options.pre[1].method).to.equal(preHandlers.loadValidatedDraftChargeInformation);
      expect(routes.getCheckData.options.pre[1].assign).to.equal('draftChargeInformation');
      expect(routes.getCheckData.options.pre[2].method).to.equal(preHandlers.loadLicence);
      expect(routes.getCheckData.options.pre[2].assign).to.equal('licence');
      expect(routes.getCheckData.options.pre[3].method).to.equal(preHandlers.loadIsChargeable);
      expect(routes.getCheckData.options.pre[3].assign).to.equal('isChargeable');
    });
  });

  experiment('postCheckData', () => {
    beforeEach(async () => {
      licenceId = uuid();
      server = testHelpers.getTestServer(routes.postCheckData);
    });

    test('allows a uuid for the licence id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/check`,
        method: 'POST'
      };

      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/test-non-uuid-licence-id/charge-information/check`,
        method: 'POST'
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('has the expected pre handlers', async () => {
      expect(routes.postCheckData.options.pre[0].method).to.equal(preHandlers.loadDraftChargeInformation);
      expect(routes.postCheckData.options.pre[0].assign).to.equal('draftChargeInformation');
      expect(routes.postCheckData.options.pre[1].method).to.equal(preHandlers.loadLicence);
      expect(routes.postCheckData.options.pre[1].assign).to.equal('licence');
    });
  });
});
