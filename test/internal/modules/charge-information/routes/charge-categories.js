'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');

const preHandlers = require('internal/modules/charge-information/pre-handlers');
const routes = require('../../../../../src/internal/modules/charge-information/routes/charge-category');
const testHelpers = require('../../../test-helpers');
const { CHARGE_CATEGORY_STEPS } = require('../../../../../src/internal/modules/charge-information/lib/charge-categories/constants');
const validChargeCategorySteps = Object.values(CHARGE_CATEGORY_STEPS);

experiment('internal/modules/charge-information/routes', () => {
  let server;
  let licenceId;
  let step;
  let categoryId;

  experiment('getChargeCategoryStep', () => {
    beforeEach(async () => {
      licenceId = uuid();
      categoryId = uuid();
      step = 'description';
      server = testHelpers.getTestServer(routes.getChargeCategoryStep);
    });

    test('allows a uuid for the licence id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/charge-category/${categoryId}/${step}`
      };
      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/test-non-uuid-licence-id/charge-information/charge-category/${categoryId}/${step}`
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    validChargeCategorySteps.forEach(step => {
      test(`Charge category ${step} is a valid value`, async () => {
        const request = {
          url: `/licences/${licenceId}/charge-information/charge-category/${categoryId}/${step}`
        };
        const response = await server.inject(request);
        expect(response.payload).to.equal('Test handler');
      });
    });

    test('does not allow an invalid values for charge category step', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/charge-category/${categoryId}/not-a-step`
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/test-non-uuid-licence-id/charge-information/charge-category/${categoryId}/${step}`
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
    test('does not allow a non uuid for the category id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/charge-category/test-non-uuid-category-id/${step}`
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('has the expected pre handlers', async () => {
      expect(routes.getChargeCategoryStep.options.pre[0].method).to.equal(preHandlers.loadLicence);
      expect(routes.getChargeCategoryStep.options.pre[0].assign).to.equal('licence');
      expect(routes.getChargeCategoryStep.options.pre[1].method).to.equal(preHandlers.loadDraftChargeInformation);
      expect(routes.getChargeCategoryStep.options.pre[1].assign).to.equal('draftChargeInformation');
    });
  });

  experiment('postChargeCategoryStep', () => {
    beforeEach(async () => {
      licenceId = uuid();
      step = 'volume';
      server = testHelpers.getTestServer(routes.postChargeCategoryStep);
    });

    test('allows a uuid for the licence id', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/charge-category/${categoryId}/${step}`,
        method: 'POST'
      };
      const response = await server.inject(request);
      expect(response.payload).to.equal('Test handler');
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/test-non-uuid-licence-id/charge-information/charge-category/${categoryId}/${step}`,
        method: 'POST'
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    validChargeCategorySteps.forEach(step => {
      test(`Charge category ${step} is a valid value`, async () => {
        const request = {
          url: `/licences/${licenceId}/charge-information/charge-category/${categoryId}/${step}`,
          method: 'POST'
        };
        const response = await server.inject(request);
        expect(response.payload).to.equal('Test handler');
      });
    });

    test('does not allow an invalid values for charge category step', async () => {
      const request = {
        url: `/licences/${licenceId}/charge-information/charge-category/${categoryId}/something-else`,
        method: 'POST'
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('does not allow a non uuid for the licence id', async () => {
      const request = {
        url: `/licences/test-non-uuid-licence-id/charge-information/charge-category/${categoryId}/${step}`,
        method: 'POST'
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('has the expected pre handlers', async () => {
      expect(routes.postChargeCategoryStep.options.pre[0].method).to.equal(preHandlers.loadLicence);
      expect(routes.postChargeCategoryStep.options.pre[0].assign).to.equal('licence');
      expect(routes.postChargeCategoryStep.options.pre[1].method).to.equal(preHandlers.loadDraftChargeInformation);
      expect(routes.postChargeCategoryStep.options.pre[1].assign).to.equal('draftChargeInformation');
    });
  });
});
