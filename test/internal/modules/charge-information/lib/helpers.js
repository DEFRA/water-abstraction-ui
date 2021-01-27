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
const services = require('internal/lib/connectors/services');

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

  experiment('.isOverridingChargeVersion', () => {
    const request = { pre: { licence: { id: 'test-licence-id' } } };
    const chargeVersions = [
      { id: 'test-charge-version-id', dateRange: { startDate: '2020-03-01', endDate: null }, licence: { id: 'test-licence-id' } },
      { id: 'test-charge-version-id', dateRange: { startDate: '2020-01-16', endDate: '2020-02-28' }, licence: { id: 'test-licence-id' } }
    ];

    beforeEach(async () => {
      sandbox.stub(services.water.chargeVersions, 'getChargeVersionsByLicenceId').returns({ data: chargeVersions });
    });
    afterEach(async () => {
      sandbox.restore();
    });

    experiment('when the new charge version start date is the same as an existing one', () => {
      test('is isOverridingChargeVersion returns true', async () => {
        const result = await helpers.isOverridingChargeVersion(request, '2020-03-01');
        expect(result).to.be.true();
      });
    });

    experiment('when the new charge version start date is NOT the same as an existing one', () => {
      test('isOverridingChargeVersion returns false', async () => {
        const result = await helpers.isOverridingChargeVersion(request, '2020-03-31');
        expect(result).to.be.false();
      });
    });
  });
});
