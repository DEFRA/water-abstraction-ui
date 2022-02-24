'use strict';

const { expect } = require('@hapi/code');
const Joi = require('joi');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const services = require('internal/lib/connectors/services');
const preHandlers = require('internal/modules/charge-information/pre-handlers');

experiment('internal/modules/charge-information/pre-handlers', () => {
  let request, result;
  const START_DATE = '2018-01-16';

  beforeEach(async () => {
    request = {
      params: {
        licenceId: 'test-licence-id',
        chargeVersionWorkflowId: 'test-charge-version-workflow-id'
      },
      query: { },
      setDraftChargeInformation: sandbox.stub(),
      clearDraftChargeInformation: sandbox.stub(),
      getDraftChargeInformation: sandbox.stub().returns({ dateRange: { startDate: START_DATE }, chargeElements: [] }),
      server: {
        methods: {
          cachedServiceRequest: sandbox.stub()
        }
      },
      pre: { draftChargeInformation: { dateRange: { startDate: START_DATE } } }
    };

    sandbox.stub(services.water.changeReasons, 'getChangeReasons').resolves({
      data: [
        {
          id: 'test-change-reason-id-1',
          type: 'new_chargeable_charge_version'
        },
        {
          id: 'test-change-reason-id-2',
          type: 'new_non_chargeable_charge_version'
        },
        {
          id: 'test-change-reason-id-3',
          type: 'new_non_chargeable_charge_version'
        }
      ]
    });

    sandbox.stub(services.water.chargeVersionWorkflows, 'getChargeVersionWorkflows').resolves(
      { status: 'review', data: [{ licence: { startDate: '2002-05-03' } }, { licence: { startDate: '2000-09-30' } }] }
    );
    sandbox.stub(services.water.chargeVersionWorkflows, 'getLicencesWithoutChargeInformation').resolves({
      data: []
    });

    sandbox.stub(services.water.licences, 'getLicenceVersions').resolves([
      { id: 'test-licence-version-1', status: 'superseded', issue: 2, increment: 0, startDate: START_DATE, endDate: '2018-01-16' },
      { id: 'test-licence-version-2', status: 'current', issue: 2, increment: 1, startDate: START_DATE, endDate: null }
    ]);

    sandbox.stub(services.water.licences, 'getLicenceAccountsByRefAndDate').resolves([
      { id: 'test-licence-account-1' },
      { id: 'test-licence-account-2' }
    ]);

    sandbox.stub(services.water.licences, 'getValidDocumentByLicenceIdAndDate').resolves({
      roles: [{
        id: 'test-billing-role-id',
        roleName: 'billing'
      }, {
        id: 'test-licence-holder-role-id',
        roleName: 'licenceHolder'
      }]
    });

    sandbox.stub(services.water.chargeCategories, 'getChargeCategory').resolves({
      billingChargeCategoryId: 'test-billing-charge-category-id',
      reference: 'test-charge-category-reference',
      shortDescription: 'test charge category short description'
    });

    sandbox.stub(services.water.chargeVersions, 'getDefaultChargesForLicenceVersion').resolves({
      data: [
        { source: 'unsupported' }
      ]
    });

    sandbox.stub(services.water.chargeVersions, 'getChargeVersionsByLicenceId').resolves({
      data: [{ id: 'test-cv-id', status: 'current', dateRange: { startDate: '2010-04-01' } }]
    });

    sandbox.stub(services.water.chargeVersions, 'getChargeVersion').resolves({
      id: 'test-charge-version-id',
      status: 'current'
    });

    sandbox.stub(services.water.chargeVersionWorkflows, 'getChargeVersionWorkflow').resolves({
      id: 'test-charge-version-workflow-id',
      status: 'review',
      chargeVersion: {
        chargeElements: [],
        id: 'test-charge-version-id',
        invoiceAccount: {
          invoiceAccountAddresses: [{
            id: 'test-invoice-account-address-id'
          }]
        }
      }
    });

    sandbox.stub(services.water.invoiceAccounts, 'getInvoiceAccount').resolves({
      id: 'test-invoice-account-id',
      invoiceAccountAddresses: [{
        id: 'test-invoice-account-address-id'
      }]
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.loadDraftChargeInformation', () => {
    beforeEach(async () => {
      request.getDraftChargeInformation.returns({
        startDate: '2020-01-01'
      });

      result = await preHandlers.loadDraftChargeInformation(request);
    });

    test('the server method is called with the licence ID', async () => {
      expect(request.getDraftChargeInformation.calledWith(
        'test-licence-id'
      )).to.be.true();
    });

    test('returns the retrieved data', async () => {
      expect(result).to.equal({ startDate: '2020-01-01' });
    });
  });

  experiment('.loadValidatedDraftChargeInformation', () => {
    beforeEach(async () => {
      request.getDraftChargeInformation.returns({
        startDate: '2020-01-01',
        chargeElements: [
          {
            id: 'test-id-1',
            status: 'draft'
          },
          {
            id: 'test-id-2'
          },
          {
            id: 'test-id-3',
            scheme: 'sroc'
          }
        ]
      });

      result = await preHandlers.loadValidatedDraftChargeInformation(request);
    });

    test('the server method is called with the licence ID', async () => {
      expect(request.getDraftChargeInformation.calledWith(
        'test-licence-id'
      )).to.be.true();
    });

    test('returns the retrieved data with only the valid charge elements', async () => {
      expect(result).to.equal({
        chargeElements: [
          {
            id: 'test-id-2'
          }, {
            chargeCategory: {
              id: 'test-billing-charge-category-id',
              reference: 'test-charge-category-reference',
              shortDescription: 'test charge category short description'
            },
            id: 'test-id-3',
            scheme: 'sroc'
          }
        ],
        startDate: '2020-01-01'
      });
    });
  });

  experiment('.loadChargeableChangeReasons', () => {
    experiment('when data is found', () => {
      beforeEach(async () => {
        result = await preHandlers.loadChargeableChangeReasons(request);
      });

      test('the service method is called', async () => {
        expect(
          services.water.changeReasons.getChangeReasons.called
        ).to.be.true();
      });

      test('resolves with reasons data', async () => {
        expect(result).to.be.an.array().length(1);
        expect(result[0].id).to.equal('test-change-reason-id-1');
      });
    });

    experiment('when the data is not found', () => {
      beforeEach(async () => {
        const err = new Error();
        err.statusCode = 404;
        services.water.changeReasons.getChangeReasons.rejects(err);
        result = await preHandlers.loadChargeableChangeReasons(request);
      });

      test('resolves with a Boom 404 error', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
        expect(result.message).to.equal('Change reasons not found');
      });
    });

    experiment('for other errors', () => {
      beforeEach(async () => {
        const err = new Error('Oh no!');
        services.water.changeReasons.getChangeReasons.rejects(err);
      });

      test('rejects with the error', async () => {
        const func = () => preHandlers.loadChargeableChangeReasons(request);
        const err = await expect(func()).to.reject();
        expect(err.message).to.equal('Oh no!');
      });
    });
  });

  experiment('.loadNonChargeableChangeReasons', () => {
    experiment('when data is found', () => {
      beforeEach(async () => {
        result = await preHandlers.loadNonChargeableChangeReasons(request);
      });

      test('the service method is called', async () => {
        expect(
          services.water.changeReasons.getChangeReasons.called
        ).to.be.true();
      });

      test('resolves with reasons data', async () => {
        expect(result).to.be.an.array().length(2);
        expect(result[0].id).to.equal('test-change-reason-id-2');
        expect(result[1].id).to.equal('test-change-reason-id-3');
      });
    });

    experiment('when the data is not found', () => {
      beforeEach(async () => {
        const err = new Error();
        err.statusCode = 404;
        services.water.changeReasons.getChangeReasons.rejects(err);
        result = await preHandlers.loadNonChargeableChangeReasons(request);
      });

      test('resolves with a Boom 404 error', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
        expect(result.message).to.equal('Change reasons not found');
      });
    });

    experiment('for other errors', () => {
      beforeEach(async () => {
        const err = new Error('Oh no!');
        services.water.changeReasons.getChangeReasons.rejects(err);
      });

      test('rejects with the error', async () => {
        const func = () => preHandlers.loadNonChargeableChangeReasons(request);
        const err = await expect(func()).to.reject();
        expect(err.message).to.equal('Oh no!');
      });
    });
  });

  experiment('.loadDefaultCharges', () => {
    experiment('when data is found', () => {
      beforeEach(async () => {
        result = await preHandlers.loadDefaultCharges(request);
      });

      test('the licence id is used to get the licence versions', async () => {
        const [licenceId] = services.water.licences.getLicenceVersions.lastCall.args;
        expect(licenceId).to.equal(request.params.licenceId);
      });

      test('the charges are requested for the current licence version', async () => {
        const [versionId] = services.water.chargeVersions.getDefaultChargesForLicenceVersion.lastCall.args;
        expect(versionId).to.equal('test-licence-version-2');
      });
    });

    experiment('when the data is not found', () => {
      beforeEach(async () => {
        const err = new Error();
        err.statusCode = 404;
        services.water.licences.getLicenceVersions.rejects(err);
        result = await preHandlers.loadDefaultCharges(request);
      });

      test('resolves with a Boom 404 error', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
        expect(result.message).to.equal('Default charges not found for licence test-licence-id');
      });
    });

    experiment('for other errors', () => {
      beforeEach(async () => {
        const err = new Error('Oh no!');
        services.water.chargeVersions.getDefaultChargesForLicenceVersion.rejects(err);
      });

      test('rejects with the error', async () => {
        const func = () => preHandlers.loadDefaultCharges(request);
        const err = await expect(func()).to.reject();
        expect(err.message).to.equal('Oh no!');
      });
    });
  });

  experiment('loadChargeVersionWorkflows', () => {
    experiment('when the service response is valid', () => {
      beforeEach(async () => {
        result = await preHandlers.loadChargeVersionWorkflows(request);
      });
      test('calls the service method', async () => {
        expect(services.water.chargeVersionWorkflows.getChargeVersionWorkflows.called).to.be.true();
      });
      test('returns the results ordered by licence start date', async () => {
        expect(result.data[0]).to.equal({ licence: { startDate: '2000-09-30' } });
        expect(result.data[1]).to.equal({ licence: { startDate: '2002-05-03' } });
      });
    });
    experiment('when the service response is invalid', () => {
      beforeEach(async () => {
        const err = new Error();
        err.statusCode = 404;
        services.water.chargeVersionWorkflows.getChargeVersionWorkflows.rejects(err);
        result = await preHandlers.loadChargeVersionWorkflows(request);
      });
      // calls the service method
      test('calls the service method', async () => {
        expect(services.water.chargeVersionWorkflows.getChargeVersionWorkflows.called).to.be.true();
      });
      test('returns an error', async () => {
        expect(result.message).to.equal('Could not retrieve charge version workflows tab setup.');
      });
    });
  });

  experiment('loadChargeVersionWorkflow', () => {
    beforeEach(async () => {
      result = await preHandlers.loadChargeVersionWorkflow(request);
    });
    test('calls the service method', async () => {
      expect(services.water.chargeVersionWorkflows.getChargeVersionWorkflow.called).to.be.true();
    });
    test('returns the result of the call', async () => {
      expect(result).to.equal({
        id: 'test-charge-version-workflow-id',
        status: 'review',
        chargeVersion: {
          chargeElements: [],
          id: 'test-charge-version-id',
          invoiceAccount: {
            invoiceAccountAddresses: [{
              id: 'test-invoice-account-address-id'
            }]
          }
        }
      });
    });
  });

  experiment('loadChargeVersionWorkflows with paging', () => {
    beforeEach(async () => {
      request = {
        query: { paget1: 2, perPage: 10, tabFilter: 'to_setup' }
      };

      result = await preHandlers.loadChargeVersionWorkflows(request);
    });
    test('calls the service method', async () => {
      expect(services.water.chargeVersionWorkflows.getChargeVersionWorkflows.called).to.be.true();
    });
    test('returns the result of the call', async () => {
      const { data } = result;
      expect(data[0].licence.startDate).to.equal('2000-09-30');
      expect(data[1].licence.startDate).to.equal('2002-05-03');
    });
  });

  experiment('loadChargeVersionWorkflowsReview with paging', () => {
    beforeEach(async () => {
      request = {
        query: { paget2: 2, perPage: 20, tabFilter: 'review' }
      };

      result = await preHandlers.loadChargeVersionWorkflowsReview(request);
    });
    test('calls the service method', async () => {
      expect(services.water.chargeVersionWorkflows.getChargeVersionWorkflows.called).to.be.true();
    });
    test('returns the result of the call', async () => {
      const { data } = result;
      expect(data[0].licence.startDate).to.equal('2000-09-30');
      expect(data[1].licence.startDate).to.equal('2002-05-03');
    });
  });

  experiment('loadChargeVersionWorkflowsChangeRequest with paging', () => {
    beforeEach(async () => {
      request = {
        query: { paget3: 1, perPage: 30, tabFilter: 'changes_requested' }
      };

      result = await preHandlers.loadChargeVersionWorkflowsChangeRequest(request);
    });
    test('calls the service method', async () => {
      expect(services.water.chargeVersionWorkflows.getChargeVersionWorkflows.called).to.be.true();
    });
    test('returns the result of the call', async () => {
      const { data } = result;
      expect(data[0].licence.startDate).to.equal('2000-09-30');
      expect(data[1].licence.startDate).to.equal('2002-05-03');
    });
  });

  experiment('.loadIsChargeable', () => {
    test('returns true if the change reason is new_chargeable_charge_version', async () => {
      request.getDraftChargeInformation.returns({
        changeReason: {
          type: 'new_chargeable_charge_version'
        }
      });

      result = await preHandlers.loadIsChargeable(request);

      expect(result).to.equal(true);
    });

    test('returns true if the change reason is new_non_chargeable_charge_version', async () => {
      request.getDraftChargeInformation.returns({
        changeReason: {
          type: 'new_non_chargeable_charge_version'
        }
      });

      result = await preHandlers.loadIsChargeable(request);

      expect(result).to.equal(false);
    });
  });

  experiment('.loadChargeVersion', () => {
    beforeEach(async () => {
      request.params.chargeVersionId = 'test-charge-version-id';
    });

    experiment('when data is found', () => {
      beforeEach(async () => {
        result = await preHandlers.loadChargeVersion(request);
      });

      test('the charge version is retrieved by its id', async () => {
        const [id] = services.water.chargeVersions.getChargeVersion.lastCall.args;
        expect(id).to.equal(request.params.chargeVersionId);
      });
    });

    experiment('when the data is not found', () => {
      beforeEach(async () => {
        const err = new Error();
        err.statusCode = 404;
        services.water.chargeVersions.getChargeVersion.rejects(err);
        result = await preHandlers.loadChargeVersion(request);
      });

      test('resolves with a Boom 404 error', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
        expect(result.message).to.equal('Cannot load charge version test-charge-version-id');
      });
    });

    experiment('for other errors', () => {
      beforeEach(async () => {
        const err = new Error('Oh no!');
        services.water.chargeVersions.getChargeVersion.rejects(err);
      });

      test('rejects with the error', async () => {
        const func = () => preHandlers.loadChargeVersion(request);
        const err = await expect(func()).to.reject();
        expect(err.message).to.equal('Oh no!');
      });
    });

    experiment('when data is found and the charge version has adjustments', () => {
      beforeEach(async () => {
        services.water.chargeVersions.getChargeVersion.returns({
          id: 'test-charge-version-id',
          status: 'current',
          scheme: 'sroc',
          chargeElements: [{ adjustments: { s127: true } }]
        });
        result = await preHandlers.loadChargeVersion(request);
      });

      test('the charge version is retrieved by its id', async () => {
        expect(result.chargeElements[0].isAdjustments).to.be.true();
      });
    });
    experiment('when data is found and the charge version does not have any adjustments', () => {
      beforeEach(async () => {
        services.water.chargeVersions.getChargeVersion.returns({
          id: 'test-charge-version-id',
          status: 'current',
          scheme: 'sroc',
          chargeElements: [{ adjustments: {} }]
        });
        result = await preHandlers.loadChargeVersion(request);
      });

      test('the charge version is retrieved by its id', async () => {
        expect(result.chargeElements[0].isAdjustments).to.be.false();
      });
    });
  });

  experiment('.loadChargeVersions', () => {
    experiment('when data is found', () => {
      beforeEach(async () => {
        result = await preHandlers.loadChargeVersions(request);
      });

      test('the service method is called', async () => {
        expect(
          services.water.chargeVersions.getChargeVersionsByLicenceId.called
        ).to.be.true();
      });

      test('resolves with reasons data', async () => {
        expect(result).to.be.an.array().length(1);
        expect(result[0].id).to.equal('test-cv-id');
      });
    });

    experiment('when the data is not found', () => {
      beforeEach(async () => {
        const err = new Error();
        err.statusCode = 404;
        services.water.chargeVersions.getChargeVersionsByLicenceId.rejects(err);
        result = await preHandlers.loadChargeVersions(request);
      });

      test('resolves with a Boom 404 error', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
        expect(result.message).to.equal('Cannot load charge versions for licence test-licence-id');
      });
    });

    experiment('for other errors', () => {
      beforeEach(async () => {
        const err = new Error('Oh no!');
        services.water.chargeVersions.getChargeVersionsByLicenceId.rejects(err);
      });

      test('rejects with the error', async () => {
        const func = () => preHandlers.loadChargeVersions(request);
        const err = await expect(func()).to.reject();
        expect(err.message).to.equal('Oh no!');
      });
    });
  });

  experiment('.loadChargeInformation', () => {
    beforeEach(async () => {
      request.params.chargeVersionWorkflowId = 'test-charge-version-workflow-id';
    });

    experiment('when data is found', () => {
      const draftChargeInfo = {
        id: 'test-charge-version-workflow-id',
        status: 'review',
        chargeVersion: {
          chargeElements: [
            {
              scheme: 'sroc',
              chargePurposes: [
                {
                  loss: 'high',
                  source: 'tidal'
                }
              ],
              additionalCharges: {
                supportedSource: {
                  id: 'test-supported-source-id',
                  name: 'test-supported-source-name'
                },
                isSupplyPublicWater: true
              }
            }
          ],
          id: 'test-charge-version-id',
          invoiceAccount: {
            invoiceAccountAddresses: [{
              id: 'test-invoice-account-address-id'
            }]
          }
        }
      };
      beforeEach(async () => {
        services.water.chargeVersionWorkflows.getChargeVersionWorkflow.returns(draftChargeInfo);
        result = await preHandlers.loadChargeInformation(request);
      });

      test('the charge version workflow is retrieved by its id', async () => {
        const [id] = services.water.chargeVersionWorkflows.getChargeVersionWorkflow.lastCall.args;
        expect(id).to.equal(request.params.chargeVersionWorkflowId);
      });

      test('the charge version data is saved in the session', async () => {
        const [licenceId, cvWorkflowId, chargeVersion] = request.setDraftChargeInformation.lastCall.args;
        expect(licenceId).to.equal(request.params.licenceId);
        expect(cvWorkflowId).to.equal('test-charge-version-workflow-id');
        expect(chargeVersion.id).to.equal('test-charge-version-id');
      });

      test('the charge version data is mapped to the shape expected by the UI', async () => {
        const [,, chargeVersion] = request.setDraftChargeInformation.lastCall.args;
        expect(chargeVersion.status).to.equal('review');
        expect(chargeVersion.invoiceAccount.invoiceAccountAddress).to.equal('test-invoice-account-address-id');
        const chargeElement = chargeVersion.chargeElements[0];
        expect(chargeElement.isAdditionalCharges).to.equal(true);
        expect(chargeElement.isSupportedSource).to.equal(true);
        expect(chargeElement.supportedSourceId).to.equal('test-supported-source-id');
        expect(chargeElement.supportedSourceName).to.equal('test-supported-source-name');
        expect(chargeElement.isSupplyPublicWater).to.equal(true);
        expect(Joi.string().uuid().validate(chargeElement.id).error).to.equal(undefined);
        expect(Joi.string().uuid().validate(chargeElement.chargePurposes[0].id).error).to.equal(undefined);
      });
    });

    experiment('when the data is not found', () => {
      beforeEach(async () => {
        const err = new Error();
        err.statusCode = 404;
        services.water.chargeVersionWorkflows.getChargeVersionWorkflow.rejects(err);
        result = await preHandlers.loadChargeInformation(request);
      });

      test('resolves with a Boom 404 error', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
        expect(result.message).to.equal('Cannot load charge version workflow test-charge-version-workflow-id');
      });
    });

    experiment('for other errors', () => {
      beforeEach(async () => {
        const err = new Error('Oh no!');
        services.water.chargeVersionWorkflows.getChargeVersionWorkflow.rejects(err);
      });

      test('rejects with the error', async () => {
        const func = () => preHandlers.loadChargeVersionWorkflow(request);
        const err = await expect(func()).to.reject();
        expect(err.message).to.equal('Oh no!');
      });
    });
  });

  experiment('.loadLicenceHolderRole', () => {
    beforeEach(async () => {
      request.pre.draftChargeInformation = { dateRange: { startDate: '2019-04-01' } };
    });

    experiment('when data is found', () => {
      beforeEach(async () => {
        result = await preHandlers.loadLicenceHolderRole(request);
      });

      test('the roles are retrieved by the licence id and start date', async () => {
        const [id, startDate] = services.water.licences.getValidDocumentByLicenceIdAndDate.lastCall.args;
        expect(id).to.equal(request.params.licenceId);
        expect(startDate).to.equal(request.pre.draftChargeInformation.dateRange.startDate);
      });
    });

    experiment('when the data is not found', () => {
      beforeEach(async () => {
        const err = new Error();
        err.statusCode = 404;
        services.water.licences.getValidDocumentByLicenceIdAndDate.rejects(err);
        result = await preHandlers.loadLicenceHolderRole(request);
      });

      test('resolves with a Boom 404 error', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
        expect(result.message).to.equal('Cannot load document for licence test-licence-id on 2019-04-01');
      });
    });

    experiment('for other errors', () => {
      beforeEach(async () => {
        const err = new Error('Oh no!');
        services.water.licences.getValidDocumentByLicenceIdAndDate.rejects(err);
      });

      test('rejects with the error', async () => {
        const func = () => preHandlers.loadLicenceHolderRole(request);
        const err = await expect(func()).to.reject();
        expect(err.message).to.equal('Oh no!');
      });
    });
  });
});
