'use strict';
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const preHandlers = require('internal/modules/charge-information/pre-handlers');
const routes = require('internal/modules/charge-information/routes/non-chargeable');
const testHelpers = require('../../../test-helpers');

experiment('internal/modules/charge-information/routes/non-chargeable', () => {
  let server;
  let licenceId;

  experiment('getNonChargeableReason', () => {
    beforeEach(async () => {
      licenceId = uuid();
      server = testHelpers.getTestServer(routes.getNonChargeableReason);
    });

    test('allows a uuid for the licence id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/non-chargeable-reason`
      };

      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/test-non-uuid-licence-id/charge-information/non-chargeable-reason`
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('allows an optional start query param which is boolean', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/non-chargeable-reason?start=1`
      };

      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('has the expected pre handlers', async () => {
      expect(routes.getNonChargeableReason.options.pre.length).to.equal(3);
      expect(routes.getNonChargeableReason.options.pre[0].method).to.equal(preHandlers.loadDraftChargeInformation);
      expect(routes.getNonChargeableReason.options.pre[0].assign).to.equal('draftChargeInformation');
      expect(routes.getNonChargeableReason.options.pre[1].method).to.equal(preHandlers.loadLicence);
      expect(routes.getNonChargeableReason.options.pre[1].assign).to.equal('licence');
      expect(routes.getNonChargeableReason.options.pre[2].method).to.equal(preHandlers.loadNonChargeableChangeReasons);
      expect(routes.getNonChargeableReason.options.pre[2].assign).to.equal('changeReasons');
    });
  });

  experiment('postNonChargeableReason', () => {
    beforeEach(async () => {
      licenceId = uuid();
      server = testHelpers.getTestServer(routes.postNonChargeableReason);
    });

    test('allows a uuid for the licence id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/non-chargeable-reason`,
        method: 'POST'
      };

      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/test-non-uuid-licence-id/charge-information/non-chargeable-reason`,
        method: 'POST'
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('has the expected pre handlers', async () => {
      expect(routes.postNonChargeableReason.options.pre.length).to.equal(3);
      expect(routes.postNonChargeableReason.options.pre[0].method).to.equal(preHandlers.loadDraftChargeInformation);
      expect(routes.postNonChargeableReason.options.pre[0].assign).to.equal('draftChargeInformation');
      expect(routes.postNonChargeableReason.options.pre[1].method).to.equal(preHandlers.loadLicence);
      expect(routes.postNonChargeableReason.options.pre[1].assign).to.equal('licence');
      expect(routes.postNonChargeableReason.options.pre[2].method).to.equal(preHandlers.loadNonChargeableChangeReasons);
      expect(routes.postNonChargeableReason.options.pre[2].assign).to.equal('changeReasons');
    });
  });

  experiment('getEffectiveDate', () => {
    beforeEach(async () => {
      licenceId = uuid();
      server = testHelpers.getTestServer(routes.getEffectiveDate);
    });

    test('allows a uuid for the licence id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/effective-date`
      };

      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: '/licences/test-non-uuid-licence-id/charge-information/effective-date'
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('has the expected pre handlers', async () => {
      expect(routes.getEffectiveDate.options.pre.length).to.equal(3);
      expect(routes.getEffectiveDate.options.pre[0].method).to.equal(preHandlers.loadDraftChargeInformation);
      expect(routes.getEffectiveDate.options.pre[0].assign).to.equal('draftChargeInformation');
      expect(routes.getEffectiveDate.options.pre[1].method).to.equal(preHandlers.loadLicence);
      expect(routes.getEffectiveDate.options.pre[1].assign).to.equal('licence');
      expect(routes.getEffectiveDate.options.pre[2].method).to.equal(preHandlers.loadIsChargeable);
      expect(routes.getEffectiveDate.options.pre[2].assign).to.equal('isChargeable');
    });
  });

  experiment('postEffectiveDate', () => {
    beforeEach(async () => {
      licenceId = uuid();
      server = testHelpers.getTestServer(routes.postEffectiveDate);
    });

    test('allows a uuid for the licence id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/effective-date`,
        method: 'POST'
      };

      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/test-non-uuid-licence-id/charge-information/effective-date`,
        method: 'POST'
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('has the expected pre handlers', async () => {
      expect(routes.postEffectiveDate.options.pre.length).to.equal(2);
      expect(routes.postEffectiveDate.options.pre[0].method).to.equal(preHandlers.loadDraftChargeInformation);
      expect(routes.postEffectiveDate.options.pre[0].assign).to.equal('draftChargeInformation');
      expect(routes.postEffectiveDate.options.pre[1].method).to.equal(preHandlers.loadLicence);
      expect(routes.postEffectiveDate.options.pre[1].assign).to.equal('licence');
    });
  });
});
