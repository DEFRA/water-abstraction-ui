'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const sessionForms = require('shared/lib/session-forms');
const helpers = require('internal/modules/charge-information/lib/helpers');

experiment('internal/modules/charge-information/lib/helpers', () => {
  experiment('getDefaultView', () => {
    let request;
    let formContainer;

    afterEach(async () => {
      sandbox.restore();
    });

    beforeEach(async () => {
      sandbox.stub(sessionForms, 'get').returns('test-form');

      formContainer = {
        form: sandbox.spy()
      };

      request = {
        view: {
          pageTitle: 'test page title'
        },
        pre: {
          licence: {
            licenceNumber: '123/123'
          }
        }
      };
    });

    test('includes the existing request view', async () => {
      const defaultView = helpers.getDefaultView(request, 'test-back', formContainer);
      expect(defaultView.pageTitle).to.equal(request.view.pageTitle);
    });

    test('if the back link is a string it is used', async () => {
      const defaultView = helpers.getDefaultView(request, 'test-back', formContainer);
      expect(defaultView.back).to.equal('test-back');
    });

    test('if the back link is a function it is called and the return value used', async () => {
      const routingLink = sandbox.stub().returns('test-link');
      const defaultView = helpers.getDefaultView(request, routingLink, formContainer);

      expect(defaultView.back).to.equal('test-link');
      expect(routingLink.calledWith(request.pre.licence.id)).to.equal(true);
    });

    test('adds a caption using the licence number', async () => {
      const defaultView = helpers.getDefaultView(request, 'test-back', formContainer);
      expect(defaultView.caption).to.equal('Licence 123/123');
    });

    test('adds the form to the view', async () => {
      const defaultView = helpers.getDefaultView(request, 'test-back', formContainer);
      expect(defaultView.form).to.equal('test-form');
      expect(formContainer.form.calledWith(request)).to.equal(true);
    });
  });

  experiment('.prepareChargeInformation', () => {
    let chargeData, mappedChargeData;
    beforeEach(async () => {
      chargeData = {
        invoiceAccount: { id: 'test-invoice-account-id' },
        chargeElements: [{
          id: 'test-charge-element-id',
          season: 'summer',
          source: 'supported',
          loss: 'high'
        }]
      };
      mappedChargeData = helpers.prepareChargeInformation('test-licence-id', chargeData);
    });

    test('returns the licence id', () => {
      expect(mappedChargeData.licenceId).to.equal('test-licence-id');
    });

    test('maps the charge data correctly', () => {
      expect(mappedChargeData.chargeVersion.invoiceAccount).to.equal(chargeData.invoiceAccount);
      expect(mappedChargeData.chargeVersion.chargeElements).to.be.an.array().and.have.length(1);
    });

    test('excludes the charge element ids', () => {
      expect(mappedChargeData.chargeVersion.chargeElements[0].id).to.be.undefined();
      expect(mappedChargeData.chargeVersion.chargeElements[0].season).to.equal('summer');
      expect(mappedChargeData.chargeVersion.chargeElements[0].source).to.equal('supported');
      expect(mappedChargeData.chargeVersion.chargeElements[0].loss).to.equal('high');
    });
  });
});
