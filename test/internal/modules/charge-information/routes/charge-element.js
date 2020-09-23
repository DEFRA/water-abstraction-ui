'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');

const preHandlers = require('internal/modules/charge-information/pre-handlers');
const routes = require('../../../../../src/internal/modules/charge-information/routes/charge-element');
const testHelpers = require('../../../test-helpers');

const validChargeElementSteps = [
  'purpose',
  'description',
  'abstraction',
  'quantities',
  'time',
  'source',
  'season',
  'loss'
];

experiment('internal/modules/charge-information/routes', () => {
  let server;
  let licenceId;
  let step;
  let elementId;

  experiment('getChargeElementStep', () => {
    beforeEach(async () => {
      licenceId = uuid();
      elementId = uuid();
      step = 'purpose';
      server = testHelpers.getTestServer(routes.getChargeElementStep);
    });

    test('allows a uuid for the licence id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/charge-element/${elementId}/${step}`
      };

      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/test-non-uuid-licence-id/charge-information/charge-element/${elementId}/${step}`
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    validChargeElementSteps.forEach(step => {
      test(`Charge element ${step} is a valid value`, async () => {
        const request = {
          url: `/licences/${licenceId}/charge-information/charge-element/${elementId}/${step}`
        };
        const response = await server.inject(request);
        expect(response.payload).to.equal('Test handler');
      });
    });

    test('does not allow an invalid values for charge element step', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/charge-element/${elementId}/charges`
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/test-non-uuid-licence-id/charge-information/charge-element/${elementId}/${step}`
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
    test('does not allow a non uuid for the element id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/charge-element/test-non-uuid-element-id/${step}`
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('has the expected pre handlers', async () => {
      expect(routes.getChargeElementStep.options.pre[0].method).to.equal(preHandlers.loadLicence);
      expect(routes.getChargeElementStep.options.pre[0].assign).to.equal('licence');
      expect(routes.getChargeElementStep.options.pre[1].method).to.equal(preHandlers.loadDefaultCharges);
      expect(routes.getChargeElementStep.options.pre[1].assign).to.equal('defaultCharges');
      expect(routes.getChargeElementStep.options.pre[2].method).to.equal(preHandlers.loadDraftChargeInformation);
      expect(routes.getChargeElementStep.options.pre[2].assign).to.equal('draftChargeInformation');
    });
  });

  experiment('postChargeElementStep', () => {
    beforeEach(async () => {
      licenceId = uuid();
      step = 'time';
      server = testHelpers.getTestServer(routes.postChargeElementStep);
    });

    test('allows a uuid for the licence id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/charge-element/${elementId}/${step}`,
        method: 'POST'
      };
      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/test-non-uuid-licence-id/charge-information/charge-element/${elementId}/${step}`,
        method: 'POST'
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    validChargeElementSteps.forEach(step => {
      test(`Charge element ${step} is a valid value`, async () => {
        const request = {
          url: `/licences/${licenceId}/charge-information/charge-element/${elementId}/${step}`,
          method: 'POST'
        };
        const response = await server.inject(request);
        expect(response.payload).to.equal('Test handler');
      });
    });

    test('does not allow an invalid values for charge element step', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/charge-element/${elementId}/charges`,
        method: 'POST'
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/test-non-uuid-licence-id/charge-information/charge-element/${elementId}/${step}`,
        method: 'POST'
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('has the expected pre handlers', async () => {
      expect(routes.postChargeElementStep.options.pre[0].method).to.equal(preHandlers.loadLicence);
      expect(routes.postChargeElementStep.options.pre[0].assign).to.equal('licence');
      expect(routes.postChargeElementStep.options.pre[1].method).to.equal(preHandlers.loadDefaultCharges);
      expect(routes.postChargeElementStep.options.pre[1].assign).to.equal('defaultCharges');
      expect(routes.postChargeElementStep.options.pre[2].method).to.equal(preHandlers.loadDraftChargeInformation);
      expect(routes.postChargeElementStep.options.pre[2].assign).to.equal('draftChargeInformation');
    });
  });
});
