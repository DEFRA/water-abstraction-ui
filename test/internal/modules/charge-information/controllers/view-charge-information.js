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
const { omit } = require('lodash');
const services = require('../../../../../src/internal/lib/connectors/services');
const { chargeVersionWorkflowReviewer } = require('../../../../../src/internal/lib/constants').scope;
const controller = require('../../../../../src/internal/modules/charge-information/controllers/view-charge-information');

const preHandlers = require('../../../../../src/internal/modules/charge-information/pre-handlers');
const chargeInformationValidator = require('../../../../../src/internal/modules/charge-information/lib/charge-information-validator');

const workflowId = uuid();
const licenceId = uuid();

const createRequest = () => ({
  params: {
    licenceId: 'test-licence-id'
  },
  query: {},
  view: {
    foo: 'bar',
    csrfToken: uuid()
  },
  defra: {
    user: {
      user_id: 123,
      user_name: '123@defra.gov.uk'
    }
  },
  pre: {
    licence: {
      id: 'test-licence-id',
      licenceNumber: '01/123'
    },
    draftChargeInformation: {
      id: workflowId,
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
    billingAccount: {
      invoiceAccountAddress: 'test-invoice-account-address-2',
      invoiceAccountAddresses: [{
        id: 'test-invoice-account-address-2',
        company: {
          name: 'second company'
        },
        dateRange: {
          startDate: '2016-10-01',
          endDate: null
        }
      }]
    },
    isChargeable: true,
    chargeVersion: {
      dateRange: {
        startDate: '2016-10-01'
      },
      changeReason: {},
      status: 'current'
    }
  }
});

const licencePageUrl = '/licences/test-licence-id#charge';

experiment('internal/modules/charge-information/controllers/view-charge-information', () => {
  let request, h;

  beforeEach(async () => {
    sandbox.stub(services.crm.documents, 'getWaterLicence').returns({
      document_id: 'test-document-id'
    });
    sandbox.stub(services.crm.documentRoles, 'getDocumentRolesByDocumentRef').resolves({ data: [] });
    sandbox.stub(services.crm.documentRoles, 'getFullHistoryOfDocumentRolesByDocumentRef').resolves({ data: [] });

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

    afterEach(() => sandbox.restore());

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

    test('has the correct billing account address', async () => {
      const { billingAccountAddress } = h.view.lastCall.args[1];
      expect(billingAccountAddress).to.equal(request.pre.billingAccount.invoiceAccountAddresses[0]);
    });

    test('has the draft charge information with validation messages', async () => {
      const { chargeVersion } = h.view.lastCall.args[1];
      expect(chargeVersion.chargeElements[0].validationWarnings).to.be.an.array();
    });

    test('loads data from cache when draftChargeInformation is not set and licence is in review', async () => {
      sandbox.stub(preHandlers, 'loadChargeInformation').returns({
        ...request.pre.draftChargeInformation,
        status: 'review'
      });
      sandbox.stub(chargeInformationValidator, 'addValidation');
      request.getDraftChargeInformation = sandbox.stub().returns({
        ...request.pre.draftChargeInformation,
        status: 'review'
      });
      request.pre.chargeInformation = {
        ...request.pre.draftChargeInformation,
        status: 'review'
      };
      request.pre.draftChargeInformation.changeReason = null;
      request.pre.draftChargeInformation.status = 'review';
      request.query.chargeVersionWorkflowId = 1;
      await controller.getReviewChargeInformation(request, h);
      const chargeVersion = h.view.lastCall.args[1];
      expect(chargeVersion.licenceId).to.equal('test-licence-id');
    });

    test('loads data from cache when draftChargeInformation is not set and licence is in changes_requested', async () => {
      sandbox.stub(preHandlers, 'loadChargeInformation').returns({
        ...request.pre.draftChargeInformation,
        status: 'changes_requested'
      });
      sandbox.stub(chargeInformationValidator, 'addValidation');
      request.getDraftChargeInformation = sandbox.stub().returns({
        ...request.pre.draftChargeInformation,
        status: 'changes_requested'
      });
      request.pre.chargeInformation = {
        ...request.pre.draftChargeInformation,
        status: 'changes_requested'
      };
      request.pre.draftChargeInformation.changeReason = null;
      request.pre.draftChargeInformation.status = 'changes_requested';
      request.query.chargeVersionWorkflowId = 1;
      await controller.getReviewChargeInformation(request, h);
      const chargeVersion = h.view.lastCall.args[1];
      expect(chargeVersion.licenceId).to.equal('test-licence-id');
    });

    experiment('sets isEditable flag', () => {
      test('to false if the charge information draft is in current', async () => {
        request.pre.draftChargeInformation['status'] = 'current';
        await controller.getReviewChargeInformation(request, h);
        const { isEditable } = h.view.lastCall.args[1];
        expect(isEditable).to.be.false();
      });

      test('to true if the charge information draft is in review', async () => {
        request.pre.draftChargeInformation['status'] = 'review';
        await controller.getReviewChargeInformation(request, h);
        const { isEditable } = h.view.lastCall.args[1];
        expect(isEditable).to.be.true();
      });

      test('to true if the charge information draft has changes_requested status', async () => {
        request.pre.draftChargeInformation['status'] = 'changes_requested';
        await controller.getReviewChargeInformation(request, h);
        const { isEditable } = h.view.lastCall.args[1];
        expect(isEditable).to.be.true();
      });
    });
  });

  experiment('.postReviewChargeInformation', () => {
    experiment('when the form is invalid', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          chargeVersionWorkflowId: workflowId,
          reviewOutcome: 'spatula',
          reviewerComments: null
        };
        request.auth = { credentials: {
          scope: chargeVersionWorkflowReviewer
        } };
        await controller.postReviewChargeInformation(request, h);
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
        expect(invoiceAccountAddress).to.equal(request.pre.billingAccount.invoiceAccountAddresses[0]);
      });

      test('has the draft charge information with validation messages', async () => {
        const { chargeVersion } = h.view.lastCall.args[1];
        expect(chargeVersion.chargeElements[0].validationWarnings).to.be.an.array();
      });

      experiment('sets isEditable flag', () => {
        test('to false if the charge information draft is in current', async () => {
          request.pre.draftChargeInformation['status'] = 'current';
          await controller.getReviewChargeInformation(request, h);
          const { isEditable } = h.view.lastCall.args[1];
          expect(isEditable).to.be.false();
        });

        test('to false if the charge information draft is in review', async () => {
          request.pre.draftChargeInformation['status'] = 'review';
          await controller.getReviewChargeInformation(request, h);
          const { isEditable } = h.view.lastCall.args[1];
          expect(isEditable).to.be.true();
        });

        test('to true if the charge information draft has changes_requested status', async () => {
          request.pre.draftChargeInformation['status'] = 'changes_requested';
          await controller.getReviewChargeInformation(request, h);
          const { isEditable } = h.view.lastCall.args[1];
          expect(isEditable).to.be.true();
        });
      });
    });

    experiment('when the form is valid', () => {
      experiment('when the review outcome is approve', () => {
        beforeEach(async () => {
          h.redirect = () => {};
          request = createRequest();
          request.payload = {
            csrf_token: request.view.csrfToken,
            chargeVersionWorkflowId: workflowId,
            reviewOutcome: 'approve',
            reviewerComments: null
          };
          request.auth = { credentials: {
            scope: chargeVersionWorkflowReviewer
          } };
          request.params = {
            licenceId: licenceId,
            chargeVersionWorkflowId: workflowId
          };
          request.clearDraftChargeInformation = sandbox.stub().resolves();
          await sandbox.stub(services.water.chargeVersionWorkflows, 'patchChargeVersionWorkflow').resolves();
          await sandbox.stub(services.water.chargeVersions, 'postCreateFromWorkflow').resolves();
          await sandbox.stub(services.water.licences, 'getDocumentByLicenceId').resolves({
            document_id: uuid(),
            metadata: { IsCurrent: true }
          });

          await controller.postReviewChargeInformation(request, h);
        });

        test('clears the session data', async () => {
          expect(request.clearDraftChargeInformation.called).to.be.true();
        });

        test('calls the service method to create a charge version', async () => {
          expect(services.water.chargeVersions.postCreateFromWorkflow.lastCall.args[0]).to.equal(workflowId);
        });
      });
      experiment('when the review outcome is not approve', () => {
        beforeEach(async () => {
          h.redirect = () => {};
          request = createRequest();
          request.payload = {
            csrf_token: request.view.csrfToken,
            chargeVersionWorkflowId: workflowId,
            reviewOutcome: 'changes_requested',
            reviewerComments: 'Terrible job',
            createdBy: { id: 19, email: 'test@test.test' }
          };
          request.auth = { credentials: {
            scope: chargeVersionWorkflowReviewer
          } };
          request.params = {
            licenceId: licenceId,
            chargeVersionWorkflowId: workflowId
          };
          request.clearDraftChargeInformation = sandbox.stub().resolves();

          await sandbox.stub(services.water.chargeVersionWorkflows, 'patchChargeVersionWorkflow').resolves();
          await sandbox.stub(services.water.licences, 'getDocumentByLicenceId').resolves({
            document_id: uuid(),
            metadata: { IsCurrent: true }
          });

          await controller.postReviewChargeInformation(request, h);
        });

        test('clears the session data', async () => {
          expect(request.clearDraftChargeInformation.called).to.be.true();
        });

        test('calls the service method to update the charge version workflow', async () => {
          expect(services.water.chargeVersionWorkflows.patchChargeVersionWorkflow.lastCall.args)
            .to.equal([
              workflowId,
              {
                status: 'changes_requested',
                approverComments: 'Terrible job',
                chargeVersion: {
                  id: workflowId,
                  dateRange: { startDate: '2019-04-01' },
                  chargeElements: [omit(request.pre.draftChargeInformation.chargeElements[0], 'id')],
                  invoiceAccount: {
                    invoiceAccountAddress: 'test-invoice-account-address-2',
                    invoiceAccountAddresses: request.pre.draftChargeInformation.invoiceAccount.invoiceAccountAddresses
                  },
                  status: 'draft'
                }
              }]);
        });
      });
    });
  });
});
