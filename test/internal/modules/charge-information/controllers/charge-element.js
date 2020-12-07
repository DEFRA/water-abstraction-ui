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

const controller = require('../../../../../src/internal/modules/charge-information/controllers/charge-element');

const { ROUTING_CONFIG, CHARGE_ELEMENT_STEPS } = require('../../../../../src/internal/modules/charge-information/lib/charge-elements/constants');

const PURPOSE_USE_ID = uuid();
const createRequest = (step, payload) => ({
  params: {
    licenceId: 'test-licence-id',
    step,
    elementId: 'test-element-id'
  },
  payload: {
    csrf_token: uuid(),
    ...payload
  },
  query: {},
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
      dateRange: { startDate: '2001-01-01' },
      chargeElements: []
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

const getExpectedChargeElementUrl = (request, step) => {
  const { licenceId, elementId, step: reqStep } = request.params;
  return `/licences/${licenceId}/charge-information/charge-element/${elementId}/${step || reqStep}`;
};

const getExpectedBackLink = request => {
  const { licenceId, step } = request.params;
  if (step === 'purpose') {
    return `/licences/${licenceId}/charge-information/use-abstraction-data`;
  }
  return getExpectedChargeElementUrl(request, ROUTING_CONFIG[step].back);
};

const getExpectedRedirectLink = request => {
  const { licenceId, step } = request.params;
  if (step === 'loss') {
    return `/licences/${licenceId}/charge-information/check`;
  }
  return getExpectedChargeElementUrl(request, ROUTING_CONFIG[step].nextStep);
};

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
  }
};

const formErrors = {
  purpose: 'Select a purpose use',
  description: 'Enter a description of the element',
  abstraction: 'Enter a real start date',
  quantities: 'Enter an authorised quantity',
  time: 'Select yes if you want to set a time limit. Select no to continue',
  source: 'Select a source',
  season: 'Select a season',
  loss: 'Select a loss category'
};

const getChargeElementDataForStep = (data, step) => {
  const chargeElement = data.chargeElements[0];
  if (step === 'purpose') return chargeElement.purposeUse.id;
  return chargeElement[step];
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
    Object.values(CHARGE_ELEMENT_STEPS).forEach(step => {
      experiment(`for step: ${step}`, () => {
        beforeEach(async () => {
          request = createRequest(step);
          await controller.getChargeElementStep(request, h);
        });

        test('uses the correct template', async () => {
          const [template] = h.view.lastCall.args;
          expect(template).to.equal('nunjucks/form');
        });

        test('sets a back link', async () => {
          const { back } = h.view.lastCall.args[1];
          expect(back).to.equal(getExpectedBackLink(request));
        });

        test('has the page title', async () => {
          const { pageTitle } = h.view.lastCall.args[1];
          expect(pageTitle).to.equal(ROUTING_CONFIG[step].pageTitle);
        });

        test('has a caption', async () => {
          const { caption } = h.view.lastCall.args[1];
          expect(caption).to.equal('Licence 01/123');
        });

        test('passes through request.view', async () => {
          const { foo } = h.view.lastCall.args[1];
          expect(foo).to.equal(request.view.foo);
        });

        test('has the expected form', async () => {
          const [, view] = h.view.lastCall.args;
          expect(view.form.action).to.equal(getExpectedChargeElementUrl(request));
          expect(view.form.method).to.equal('POST');
        });
      });
    });
  });

  experiment('.postChargeElementStep', () => {
    Object.values(CHARGE_ELEMENT_STEPS).forEach(step => {
      experiment(`for step: ${step}`, () => {
        experiment('when a valid payload is posted', () => {
          beforeEach(async () => {
            request = createRequest(step, validPayload[step]);
            await controller.postChargeElementStep(request, h);
          });

          test('the draft charge information is updated with the step data', async () => {
            const [id, data] = request.setDraftChargeInformation.lastCall.args;
            const stepData = getChargeElementDataForStep(data, step);
            expect(id).to.equal('test-licence-id');
            expect(stepData).to.equal(request.payload[step]);
          });

          test('the user is redirected to the expected page', async () => {
            const expectedNextPageUrl = getExpectedRedirectLink(request);
            expect(h.redirect.calledWith(expectedNextPageUrl)).to.be.true();
          });
        });

        experiment('when an invalid payload is posted', () => {
          beforeEach(async () => {
            request = createRequest(step);
            await controller.postChargeElementStep(request, h);
          });

          test('the draft charge information is not updated', async () => {
            expect(request.setDraftChargeInformation.called).to.be.false();
          });

          test('the form in error state is passed to the post-redirect-get handler', async () => {
            const [form, redirectPath] = h.postRedirectGet.lastCall.args;
            expect(form.errors[0].message).to.equal(formErrors[step]);
            expect(redirectPath).to.equal(getExpectedChargeElementUrl(request));
          });
        });
      });
    });
  });
});
