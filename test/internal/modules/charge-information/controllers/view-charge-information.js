'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const uuid = require('uuid/v4');
const sandbox = sinon.createSandbox();

const services = require('../../../../../src/internal/lib/connectors/services');
const { chargeVersionWorkflowReviewer, chargeVersionWorkflowEditor } = require('../../../../../src/internal/lib/constants').scope;
const controller = require('../../../../../src/internal/modules/charge-information/controllers/view-charge-information');

const createRequest = () => ({
  params: {
    licenceId: 'test-licence-id'
  },
  query: {},
  view: {
    foo: 'bar',
    csrfToken: uuid()
  },
  pre: {
    licence: {
      id: 'test-licence-id',
      licenceNumber: '01/123'
    },
    draftChargeInformation: {
      dateRange: { startDate: '2019-04-01' },
      chargeElements: [{
        id: 'test-element-id',
        season: 'summer',
        abstractionPeriod: {
          startDay: 1,
          startMonth: 4,
          endDay: 31,
          endMonth: 10
        },
        loss: 'high',
        purposeUse: {
          lossFactor: 'high'
        },
        billableAnnualQuantity: null,
        authorisedAnnualQuantity: 55
      }],
      invoiceAccount: {
        invoiceAccountAddress: 'test-invoice-account-address-2',
        invoiceAccountAddresses: [{
          id: 'test-invoice-account-address-1',
          company: {
            name: 'first company'
          }
        }, {
          id: 'test-invoice-account-address-2',
          company: {
            name: 'second company'
          }
        }]
      }
    },
    isChargeable: true,
    chargeVersion: {
      dateRange: {
        startDate: '2016-10-01'
      },
      status: 'current'
    }
  }
});

const licencePageUrl = '/licences/test-document-id#charge';

experiment('internal/modules/charge-information/controllers/view-charge-information', () => {
  let request, h;

  beforeEach(async () => {
    sandbox.stub(services.crm.documents, 'getWaterLicence').returns({
      document_id: 'test-document-id'
    });
    h = {
      view: sandbox.stub()
    };
  });

  afterEach(() => sandbox.restore());

  experiment('.getViewChargeInformation', () => {
    beforeEach(async () => {
      request = createRequest();
      await controller.getViewChargeInformation(request, h);
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/charge-information/view');
    });

    test('sets a back link', async () => {
      const { back } = h.view.lastCall.args[1];
      expect(back).to.equal(licencePageUrl);
    });

    test('has the page title', async () => {
      const { pageTitle } = h.view.lastCall.args[1];
      expect(pageTitle).to.equal('Charge information valid from 1 October 2016');
    });

    test('has a caption', async () => {
      const { caption } = h.view.lastCall.args[1];
      expect(caption).to.equal('Licence 01/123');
    });

    test('passes through request.view', async () => {
      const { foo } = h.view.lastCall.args[1];
      expect(foo).to.equal(request.view.foo);
    });

    test('has the charge version', async () => {
      const { chargeVersion } = h.view.lastCall.args[1];
      expect(chargeVersion).to.equal(request.pre.chargeVersion);
    });
  });

  experiment('.getReviewChargeInformation', () => {
    beforeEach(async () => {
      request = createRequest();
      request.auth = { credentials: {
        scope: chargeVersionWorkflowReviewer
      } };
      await controller.getReviewChargeInformation(request, h);
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/charge-information/view');
    });

    test('sets a back link', async () => {
      const { back } = h.view.lastCall.args[1];
      expect(back).to.equal(licencePageUrl);
    });

    test('has the page title', async () => {
      const { pageTitle } = h.view.lastCall.args[1];
      expect(pageTitle).to.equal('Check charge information');
    });

    test('has a caption', async () => {
      const { caption } = h.view.lastCall.args[1];
      expect(caption).to.equal('Licence 01/123');
    });

    test('passes through request.view', async () => {
      const { foo } = h.view.lastCall.args[1];
      expect(foo).to.equal(request.view.foo);
    });

    test('has the correct invoice account address', async () => {
      const { invoiceAccountAddress } = h.view.lastCall.args[1];
      expect(invoiceAccountAddress).to.equal(request.pre.draftChargeInformation.invoiceAccount.invoiceAccountAddresses[1]);
    });

    test('has the draft charge information with validation messages', async () => {
      const { chargeVersion } = h.view.lastCall.args[1];
      expect(chargeVersion.chargeElements[0].validationWarnings).to.be.an.array();
    });

    experiment('sets isEditable flag', () => {
      test('to false if the charge information draft is in review', async () => {
        request.pre.draftChargeInformation['status'] = 'review';
        await controller.getReviewChargeInformation(request, h);
        const { isEditable } = h.view.lastCall.args[1];
        expect(isEditable).to.be.false();
      });

      test('to true if the charge information draft has changes_requested status', async () => {
        request.pre.draftChargeInformation['status'] = 'changes_requested';
        await controller.getReviewChargeInformation(request, h);
        const { isEditable } = h.view.lastCall.args[1];
        expect(isEditable).to.be.true();
      });
    });
  });
});
