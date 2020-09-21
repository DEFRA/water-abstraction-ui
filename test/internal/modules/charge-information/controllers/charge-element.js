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
const formHelpers = require('../../../../../src/shared/lib/forms');

const controller = require('../../../../../src/internal/modules/charge-information/controllers/charge-element');

const routingConfig = {
  purpose: { pageTitle: 'Select a purpose use', nextStep: 'description' },
  description: { pageTitle: 'Add element description', nextStep: 'abstraction', back: 'purpose' },
  abstraction: { pageTitle: 'Set abstraction period', nextStep: 'quantities', back: 'description' },
  quantities: { pageTitle: 'Add licence quantities', nextStep: 'time', back: 'abstraction' },
  time: { pageTitle: 'Set time limit?', nextStep: 'source', back: 'quantities' },
  source: { pageTitle: 'Select source', nextStep: 'season', back: 'time' },
  season: { pageTitle: 'Select season', nextStep: 'loss', back: 'source' },
  loss: { pageTitle: 'Select loss category', nextStep: 'loss', back: 'season' }
};

const createRequest = (step) => ({
  params: {
    licenceId: 'test-licence-id',
    step
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
      startDate: '2001-01-01'
    },
    defaultCharges: [
      {
        season: 'summer',
        purposeUse: {
          id: 'purpose-use-id',
          name: ''
        }
      }
    ]
  },
  yar: {
    get: sandbox.stub(),
    set: sandbox.stub(),
    clear: sandbox.stub()
  },
  server: {
    methods: {
      setDraftChargeInformation: sandbox.stub()
    }
  }
});

// const getReadableDate = str => moment(str).format('D MMMM YYYY');
// const getISODate = str => moment(str).format('YYYY-MM-DD');

experiment('internal/modules/charge-information/controllers/charge-element', () => {
  let request, h;

  beforeEach(async () => {
    h = {
      view: sandbox.stub(),
      postRedirectGet: sandbox.stub(),
      redirect: sandbox.stub()
    };
  });

  experiment('.getChargeElementStep', () => {
    const validSteps = ['purpose', 'description', 'abstraction', 'quantities', 'time', 'source', 'season', 'loss'];

    validSteps.forEach(step => {
      test(`the controller returns the correct form for ${step}`, async () => {
        request = createRequest(step);
        await controller.getChargeElementStep(request, h);
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
      });
      test(`returns the correct page title for ${step}`, async () => {
        request = createRequest(step);
        await controller.getChargeElementStep(request, h);
        const { pageTitle } = h.view.lastCall.args[1];
        expect(pageTitle).to.equal(routingConfig[step].pageTitle);
      });
      test('sets a back link', async () => {
        request = createRequest(step);
        await controller.getChargeElementStep(request, h);
        const { back } = h.view.lastCall.args[1];
        if (step !== 'purpose') {
          expect(back).to.equal(`/licences/test-licence-id/charge-information/charge-element/${routingConfig[step].back}`);
        } else { expect(back).to.equal('/licences/test-licence-id/charge-information/use-abstraction-data'); }
      });
      test('has a caption', async () => {
        request = createRequest(step);
        await controller.getChargeElementStep(request, h);
        const { caption } = h.view.lastCall.args[1];
        expect(caption).to.equal('Licence 01/123');
      });
      test('passes through request.view', async () => {
        request = createRequest(step);
        await controller.getChargeElementStep(request, h);
        const { foo } = h.view.lastCall.args[1];
        expect(foo).to.equal(request.view.foo);
      });
      test('has a form', async () => {
        request = createRequest(step);
        await controller.getChargeElementStep(request, h);
        const { form } = h.view.lastCall.args[1];
        expect(form).to.be.an.object();
      });
    });
  });

  experiment('.postChargeElementStep', () => {
    const validSteps = ['purpose', 'description', 'abstraction', 'quantities', 'time', 'source', 'season', 'loss'];
    experiment('when the form isValid = true', () => {
      beforeEach(async => {
        sandbox.stub(formHelpers, 'handleRequest').returns({ isValid: true });
        sandbox.stub(formHelpers, 'getValues').returns({ purpose: 'purpose-use-id' });
      });
      afterEach(async => {
        sandbox.restore();
      });
      validSteps.forEach(step => {
        test(`the controller returns the correct form for ${step}`, async () => {
          request = createRequest(step);
          await controller.postChargeElementStep(request, h);
          const args = h.redirect.lastCall.args;
          if (step !== 'loss') {
            expect(args[0]).to.equal(`/licences/test-licence-id/charge-information/charge-element/${routingConfig[step].nextStep}`);
          } else { expect(args[0]).to.equal('/licences/test-licence-id/charge-information/check'); }
        });
      });
    });
    experiment('when the form isValid = false', () => {
      beforeEach(async => {
        sandbox.stub(formHelpers, 'handleRequest').returns({ isValid: false });
      });
      afterEach(async => {
        sandbox.restore();
      });
      validSteps.forEach(step => {
        test(`the controller returns the correct form for ${step} and redirects to the correct route`, async () => {
          request = createRequest(step);
          await controller.postChargeElementStep(request, h);
          const args = h.postRedirectGet.lastCall.args;
          expect(args[0]).to.equal({ isValid: false });
          expect(args[1]).to.equal(`/licences/test-licence-id/charge-information/charge-element/${step}`);
        });
      });
    });
  });
});
