'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const moment = require('moment');
const uuid = require('uuid/v4');
const sandbox = sinon.createSandbox();

const controller = require('../../../../../src/internal/modules/charge-information/controllers/charge-category');
const services = require('../../../../../src/internal/lib/connectors/services');
const { ROUTING_CONFIG, CHARGE_CATEGORY_STEPS } = require('../../../../../src/internal/modules/charge-information/lib/charge-categories/constants');

const PURPOSE_USE_ID = uuid();

const licenceId = 'test-licence-id';
const elementId = 'test-element-id';

const createRequest = (step, payload) => ({
  params: {
    licenceId,
    step,
    elementId
  },
  payload: {
    csrf_token: uuid(),
    ...payload
  },
  query: {
  },
  view: {
    foo: 'bar',
    csrfToken: uuid()
  },
  pre: {
    licence: {
      id: 'test-licence-id',
      licenceNumber: '01/123',
      regionalChargeArea: { name: 'Test Region' },
      startDate: moment().subtract(2, 'years').format('YYYY-MM-DD')
    },
    draftChargeInformation: {
      dateRange: { startDate: '2022-04-01' },
      chargeElements: [{
        id: elementId,
        scheme: 'sroc'
      }],
      scheme: 'sroc'
    }
  },
  yar: {
    get: sandbox.stub()
  },
  setDraftChargeInformation: sandbox.stub(),
  clearDraftChargeInformation: sandbox.stub()
});

const validPayload = {
  source: { purpose: PURPOSE_USE_ID },
  description: { description: 'test-description' },
  loss: { loss: 'high' },
  isAdjustments: { isAdjustments: 'false' }
};

const chargeCategory = {
  billingChargeCategoryId: 'test-reference-id',
  reference: '1.0',
  shortDescription: 'test-charge-category-description'
};

experiment('internal/modules/charge-information/controllers/charge-category', () => {
  let request, h;

  beforeEach(async () => {
    h = {
      view: sandbox.stub(),
      postRedirectGet: sandbox.stub(),
      redirect: sandbox.stub()
    };
    sandbox.stub(services.water.chargeCategories, 'getChargeCategory').resolves(chargeCategory);
  });
  afterEach(() => sandbox.restore());

  experiment('.getChargeCategporyStep', () => {
    experiment('enter a description', () => {
      beforeEach(async () => {
        request = createRequest(CHARGE_CATEGORY_STEPS.description);
        await controller.getChargeCategoryStep(request, h);
      });

      test('uses the correct template', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
      });

      test('sets a back link to the previous page in the flow', async () => {
        const { back } = h.view.lastCall.args[1];
        expect(back).to.equal(`/licences/${licenceId}/charge-information/check`);
      });

      test('has the page title', async () => {
        const { pageTitle } = h.view.lastCall.args[1];
        expect(pageTitle).to.equal(ROUTING_CONFIG[CHARGE_CATEGORY_STEPS.description].pageTitle);
      });

      test('has a caption', async () => {
        const { caption } = h.view.lastCall.args[1];
        expect(caption).to.equal('Licence 01/123');
      });

      test('passes through request.view', async () => {
        const { foo } = h.view.lastCall.args[1];
        expect(foo).to.equal(request.view.foo);
      });

      test('defines a form object', async () => {
        const [, view] = h.view.lastCall.args;
        expect(view.form).to.be.an.object();
        expect(view.form.method).to.equal('POST');
        expect(view.form.action).to.equal(`/licences/${licenceId}/charge-information/charge-category/${elementId}/description`);
      });
    });

    experiment('when the returnToCheckData query param is set', () => {
      beforeEach(async () => {
        request = createRequest(CHARGE_CATEGORY_STEPS.description);
        request.query.returnToCheckData = true;
        await controller.getChargeCategoryStep(request, h);
      });

      test('the back link is to the check answers page', async () => {
        const { back } = h.view.lastCall.args[1];
        expect(back).to.equal(`/licences/${licenceId}/charge-information/check`);
      });
    });

    experiment('for a step mid-way through the flow', () => {
      beforeEach(async () => {
        request = createRequest(CHARGE_CATEGORY_STEPS.loss);
        await controller.getChargeCategoryStep(request, h);
      });

      test('sets a back link to the previous step', async () => {
        const { back } = h.view.lastCall.args[1];
        expect(back).to.equal(`/licences/${licenceId}/charge-information/charge-category/${elementId}/${CHARGE_CATEGORY_STEPS.source}`);
      });
    });

    experiment('.postChargeCategoryStep', () => {
      experiment('when a valid payload is posted', () => {
        beforeEach(async () => {
          request = createRequest(CHARGE_CATEGORY_STEPS.loss, validPayload.loss);
          await controller.postChargeCategoryStep(request, h);
        });

        test('the draft charge information is updated with the step data', async () => {
          const [id, cvWorkflowId, data] = request.setDraftChargeInformation.lastCall.args;
          expect(cvWorkflowId).to.equal(undefined);
          expect(id).to.equal('test-licence-id');
          expect(data.loss).to.equal(request.pre.draftChargeInformation.loss);

          // Check element updated
          const chargeElement = data.chargeElements.find(row => row.id === elementId);
          expect(chargeElement.loss).to.equal(validPayload.loss.loss);
        });

        test('the user is redirected to the expected page', async () => {
          expect(h.redirect.calledWith(
            `/licences/test-licence-id/charge-information/charge-category/${elementId}/${CHARGE_CATEGORY_STEPS.volume}`
          )).to.be.true();
        });
      });
      experiment('when the last charge category step in the flow is reached', () => {
        beforeEach(async () => {
          request = createRequest(CHARGE_CATEGORY_STEPS.isAdjustments, validPayload.isAdjustments);
          request.pre.draftChargeInformation.chargeElements = [{ id: 'test-element-id' }];
          await controller.postChargeCategoryStep(request, h);
        });

        test('the draft charge information is updated with the charge reference', async () => {
          const [id, cvWorkflowId, data] = request.setDraftChargeInformation.lastCall.args;
          expect(cvWorkflowId).to.equal(undefined);
          expect(id).to.equal('test-licence-id');
          expect(data.chargeElements[0].chargeCategory).to.equal(
            {
              id: chargeCategory.billingChargeCategoryId,
              reference: chargeCategory.reference,
              shortDescription: chargeCategory.shortDescription
            });
        });

        test('the draft charge information is updated with the charge reference', async () => {
          const args = request.setDraftChargeInformation.lastCall.args;
          expect(args[2].chargeElements[0].isAdjustments).to.equal(false);
        });

        test('the user is redirected to the chack your answers page', async () => {
          expect(h.redirect.calledWith(
            `/licences/test-licence-id/charge-information/check`
          )).to.be.true();
        });
      });
    });
  });
});
