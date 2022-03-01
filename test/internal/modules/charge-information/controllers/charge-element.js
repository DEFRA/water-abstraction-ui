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
const { v4: uuid } = require('uuid');
const sandbox = sinon.createSandbox();

const controller = require('../../../../../src/internal/modules/charge-information/controllers/charge-element');

const {
  ROUTING_CONFIG,
  CHARGE_ELEMENT_STEPS
} = require('../../../../../src/internal/modules/charge-information/lib/charge-elements/constants');

const PURPOSE_USE_ID = uuid();

const licenceId = 'test-licence-id';
const elementId = 'test-element-id';

const createRequest = (step, payload, isSroc = false) => ({
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
    categoryId: ''
  },
  view: {
    foo: 'bar',
    csrfToken: uuid()
  },
  pre: {
    licence: {
      id: 'test-licence-id',
      licenceNumber: '01/123',
      startDate: moment().subtract(2, 'years').format('YYYY-MM-DD')
    },
    draftChargeInformation: {
      dateRange: { startDate: isSroc ? '2022-04-01' : '2001-01-01' },
      chargeElements: [{
        id: elementId,
        scheme: isSroc ? 'sroc' : 'alcs'
      }],
      scheme: isSroc ? 'sroc' : 'alcs'

    },
    defaultCharges: [
      {
        season: 'summer',
        purposeUse: {
          id: PURPOSE_USE_ID,
          name: ''
        },
        purposePrimary: {
          id: 'test-primary-purpose'
        },
        purposeSecondary: {
          id: 'test-secondary-purpose'
        }
      }
    ]
  },
  yar: {
    get: sandbox.stub()
  },
  setDraftChargeInformation: sandbox.stub(),
  clearDraftChargeInformation: sandbox.stub()
});

const validPayload = {
  purpose: {
    purpose: PURPOSE_USE_ID
  },
  description: {
    description: 'test-description'
  },
  abstraction: {
    'startDate-day': '1',
    'startDate-month': '4',
    'endDate-day': '31',
    'endDate-month': '10'
  },
  quantities: {
    authorisedAnnualQuantity: '1234',
    billableAnnualQuantity: ''
  },
  time: {
    timeLimitedPeriod: 'no'
  },
  source: {
    source: 'supported'
  },
  season: {
    season: 'summer'
  },
  loss: {
    loss: 'high'
  },
  agreements: {
    isSection127AgreementEnabled: 'true'
  }
};

experiment('internal/modules/charge-information/controllers/charge-element', () => {
  let request, h;

  beforeEach(async () => {
    h = {
      view: sandbox.stub(),
      postRedirectGet: sandbox.stub(),
      redirect: sandbox.stub()
    };
  });
  afterEach(() => sandbox.restore());

  experiment('.getChargeElementStep', () => {
    experiment('for selecting a purpose use', () => {
      beforeEach(async () => {
        request = createRequest(CHARGE_ELEMENT_STEPS.purpose);
        await controller.getChargeElementStep(request, h);
      });

      test('uses the correct template', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
      });

      test('sets a back link to the previous page in the flow', async () => {
        const { back } = h.view.lastCall.args[1];
        expect(back).to.equal(`/licences/${licenceId}/charge-information/use-abstraction-data`);
      });

      test('has the page title', async () => {
        const { pageTitle } = h.view.lastCall.args[1];
        expect(pageTitle).to.equal(ROUTING_CONFIG[CHARGE_ELEMENT_STEPS.purpose].pageTitle);
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
        expect(view.form.action).to.equal(`/licences/${licenceId}/charge-information/charge-element/${elementId}/purpose`);
      });
    });

    experiment('when the returnToCheckData query param is set', () => {
      beforeEach(async () => {
        request = createRequest(CHARGE_ELEMENT_STEPS.purpose);
        request.query.returnToCheckData = true;
        await controller.getChargeElementStep(request, h);
      });

      test('the back link is to the check answers page', async () => {
        const { back } = h.view.lastCall.args[1];
        expect(back).to.equal(`/licences/${licenceId}/charge-information/check`);
      });
    });

    experiment('for a step mid-way through the flow', () => {
      experiment('for an ALCS draft', () => {
        beforeEach(async () => {
          request = createRequest(CHARGE_ELEMENT_STEPS.loss);
          await controller.getChargeElementStep(request, h);
        });

        test('sets a back link to the previous step', async () => {
          const { back } = h.view.lastCall.args[1];
          expect(back).to.equal(`/licences/${licenceId}/charge-information/charge-element/${elementId}/${CHARGE_ELEMENT_STEPS.season}`);
        });
      });
      experiment('for an SROC draft', () => {
        beforeEach(async () => {
          request = createRequest(CHARGE_ELEMENT_STEPS.loss, {}, true);
          await controller.getChargeElementStep(request, h);
        });

        test('sets a back link to the previous step', async () => {
          const { back } = h.view.lastCall.args[1];
          expect(back).to.equal(`/licences/${licenceId}/charge-information/charge-element/${elementId}/${CHARGE_ELEMENT_STEPS.timeLimit}`);
        });
      });
    });

    experiment('.postChargeElementStep', () => {
      experiment('when a valid payload is posted', () => {
        beforeEach(async () => {
          request = createRequest(CHARGE_ELEMENT_STEPS.loss, validPayload.loss);
          request.query.returnToCheckData = false;
          await controller.postChargeElementStep(request, h);
        });

        test('the draft charge information is updated with the step data', async () => {
          const [id, cvWorkflowId, data] = request.setDraftChargeInformation.lastCall.args;
          expect(cvWorkflowId).to.equal(undefined);
          expect(id).to.equal('test-licence-id');
          expect(data.dateRange).to.equal(request.pre.draftChargeInformation.dateRange);

          // Check element updated
          const chargeElement = data.chargeElements.find(row => row.id === elementId);
          expect(chargeElement.loss).to.equal(validPayload.loss.loss);
        });

        test('the user is redirected to the expected page', async () => {
          expect(h.redirect.calledWith(
            '/licences/test-licence-id/charge-information/check'
          )).to.be.true();
        });
      });

      experiment('when a new sroc charge purpose is posted', () => {
        beforeEach(async () => {
          request = createRequest(CHARGE_ELEMENT_STEPS.season, validPayload.season);
          const testCategoryId = 'test-category-id';
          request.query = {
            categoryId: testCategoryId,
            returnToCheckData: true
          };
          request.pre.draftChargeInformation.chargeElements =
            [{
              id: testCategoryId,
              chargePurposes: [{ id: 'test-element-id' }]
            }];
          await controller.postChargeElementStep(request, h);
        });

        test('the draft charge information charge purpose is updated correctly', async () => {
          const [id, cvWorkflowId, data] = request.setDraftChargeInformation.lastCall.args;
          expect(cvWorkflowId).to.equal(undefined);
          expect(id).to.equal('test-licence-id');
          expect(data.chargeElements[0]).to.equal(
            {
              chargePurposes:
                [{
                  id: 'test-element-id',
                  season: 'summer'
                }],
              id: 'test-category-id'
            });
        });

        test('the user is redirected to the expected page', async () => {
          expect(h.redirect.calledWith(
            '/licences/test-licence-id/charge-information/check'
          )).to.be.true();
        });
      });
    });
  });

  experiment('when the charge is in review', () => {
    beforeEach(async () => {
      request = createRequest('loss', validPayload.loss);
      request.pre.draftChargeInformation.status = 'review';
      request.query.chargeVersionWorkflowId = '1';
      await controller.postChargeElementStep(request, h);
    });

    test('the user is redirected to the expected page', async () => {
      expect(h.redirect.calledWith('/licences/test-licence-id/charge-information/1/review')).to.be.true();
    });
  });
});
