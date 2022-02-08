'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const routing = require('internal/modules/charge-information/lib/routing');

experiment('internal/modules/charge-information/lib/routing', () => {
  let licence, chargeVersionWorkflowId;

  beforeEach(async () => {
    licence = {
      id: 'test-licence-id',
      region: {
        id: 'test-region-id'
      }
    };
    chargeVersionWorkflowId = 'test-workflow-id';
  });

  experiment('.getChargeElementStep', () => {
    test('returns the correct url', async () => {
      const url = routing.getChargeElementStep(licence.id, 'test-element-id', 'test-step');
      expect(url).to.equal('/licences/test-licence-id/charge-information/charge-element/test-element-id/test-step');
    });
  });

  experiment('.getSubmitted', () => {
    test('returns the correct url', async () => {
      const url = routing.getSubmitted(licence.id, { chargeable: true });
      expect(url).to.equal('/licences/test-licence-id/charge-information/submitted?chargeable=true');
    });
  });

  experiment('.getCheckData', () => {
    test('returns the correct url', async () => {
      const url = routing.getCheckData(licence.id);
      expect(url).to.equal('/licences/test-licence-id/charge-information/check');
    });
  });

  experiment('.getReason', () => {
    test('returns the correct url', async () => {
      const url = routing.getReason(licence.id);
      expect(url).to.equal('/licences/test-licence-id/charge-information/create');
    });
  });

  experiment('.getStartDate', () => {
    test('returns the correct url', async () => {
      const url = routing.getStartDate(licence.id);
      expect(url).to.equal('/licences/test-licence-id/charge-information/start-date');
    });
  });

  experiment('.getSelectBillingAccount', () => {
    test('returns the correct url', async () => {
      const url = routing.getSelectBillingAccount(licence.id);
      expect(url).to.equal('/licences/test-licence-id/charge-information/billing-account');
    });
  });

  experiment('.getUseAbstractionData', () => {
    test('returns the correct url', async () => {
      const url = routing.getUseAbstractionData(licence.id);
      expect(url).to.equal('/licences/test-licence-id/charge-information/use-abstraction-data');
    });
  });

  experiment('.getEffectiveDate', () => {
    test('returns the correct url', async () => {
      const url = routing.getEffectiveDate(licence.id);
      expect(url).to.equal('/licences/test-licence-id/charge-information/effective-date');
    });
  });

  experiment('.getNonChargeableReason', () => {
    test('returns the correct url', async () => {
      const url = routing.getNonChargeableReason(licence.id);
      expect(url).to.equal('/licences/test-licence-id/charge-information/non-chargeable-reason');
    });
  });

  experiment('.getCancelData', () => {
    test('returns the correct url', async () => {
      const url = routing.getCancelData(licence.id);
      expect(url).to.equal('/licences/test-licence-id/charge-information/cancel');
    });
  });

  experiment('.getReview', () => {
    test('returns the correct url', async () => {
      const url = routing.getReview(chargeVersionWorkflowId, licence.id);
      expect(url).to.equal('/licences/test-licence-id/charge-information/test-workflow-id/review');
    });
  });

  experiment('.getSupportedSourcesRoute', () => {
    let request, chargeElement, stepKey, checkYourAnswersRoute;
    beforeEach(() => {
      request = {
        params: { licenceId: 'test-licence-id', elementId: 'test-element-id' },
        query: { chargeVersionWorkflowId: 'test-workflow-id', returnToCheckData: true, additionalChargesAdded: true }
      };
      chargeElement = { id: 'test-element-id' };
      stepKey = 'isSupportedSource';
      checkYourAnswersRoute = routing.getCheckData('test-licence-id');
    });
    test('when the charge element does NOT have a supported source it returns the correct url', async () => {
      chargeElement.isSupportedSource = false;
      const url = routing.getSupportedSourcesRoute(request, chargeElement, stepKey, checkYourAnswersRoute);
      expect(url).to
        .equal('/licences/test-licence-id/charge-information/charge-category/test-element-id/supply-public-water?returnToCheckData=true&chargeVersionWorkflowId=test-workflow-id&additionalChargesAdded=true');
    });
    test('when the charge element does have a supported source it returns the correct url', async () => {
      chargeElement.isSupportedSource = true;
      const url = routing.getSupportedSourcesRoute(request, chargeElement, stepKey, checkYourAnswersRoute);
      expect(url).to
        .equal('/licences/test-licence-id/charge-information/charge-category/test-element-id/supported-source-name?returnToCheckData=true&chargeVersionWorkflowId=test-workflow-id&additionalChargesAdded=true');
    });
    test(`when the returnToCheckData is true but there is no supported source 
        and the isAdditionalCharges did not previously change from false to true it returns the correct url`, async () => {
      chargeElement.isSupportedSource = false;
      request.query.additionalChargesAdded = false;
      const url = routing.getSupportedSourcesRoute(request, chargeElement, stepKey, checkYourAnswersRoute);
      expect(url).to
        .equal('/licences/test-licence-id/charge-information/check');
    });
  });
  experiment('.getAditionalChargesRoute', () => {
    let request, chargeElement, stepKey, checkYourAnswersRoute;
    beforeEach(() => {
      request = {
        params: { licenceId: 'test-licence-id', elementId: 'test-element-id' },
        query: { chargeVersionWorkflowId: 'test-workflow-id', returnToCheckData: true }
      };
      chargeElement = { id: 'test-element-id', isAdditionalCharges: false };
      stepKey = 'isAdditionalCharges';
      checkYourAnswersRoute = routing.getCheckData('test-licence-id');
    });

    test('when the charge element does NOT have any additional charges and returnToCheckData is true it returns the correct url', async () => {
      const url = routing.getAditionalChargesRoute(request, chargeElement, stepKey, checkYourAnswersRoute);
      expect(url).to
        .equal('/licences/test-licence-id/charge-information/check');
    });
    test('when the charge element does have a additional charge and returnToCheckData is true it returns the correct url', async () => {
      chargeElement.isAdditionalCharges = true;
      const url = routing.getAditionalChargesRoute(request, chargeElement, stepKey, checkYourAnswersRoute);
      expect(url).to
        .equal('/licences/test-licence-id/charge-information/charge-category/test-element-id/supported-source?returnToCheckData=true&chargeVersionWorkflowId=test-workflow-id&additionalChargesAdded=true');
    });
    test('when the charge element does have a additional charge and returnToCheckData is false it returns the correct url', async () => {
      chargeElement.isAdditionalCharges = true;
      request.query = {};
      const url = routing.getAditionalChargesRoute(request, chargeElement, stepKey, checkYourAnswersRoute);
      expect(url).to
        .equal('/licences/test-licence-id/charge-information/charge-category/test-element-id/supported-source');
    });
    test(`when the returnToCheckData is true but there is no supported source 
        and the isAdditionalCharges did not previously change from false to true it returns the correct url`, async () => {
      chargeElement.isSupportedSource = false;
      request.query.additionalChargesAdded = false;
      const url = routing.getAditionalChargesRoute(request, chargeElement, stepKey, checkYourAnswersRoute);
      expect(url).to
        .equal('/licences/test-licence-id/charge-information/check');
    });
  });
});
