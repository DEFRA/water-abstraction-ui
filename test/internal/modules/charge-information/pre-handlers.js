'use strict';

const { expect } = require('@hapi/code');
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
        licenceId: 'test-licence-id'
      },
      query: {},
      setDraftChargeInformation: sandbox.stub(),
      getDraftChargeInformation: sandbox.stub().returns({ dateRange: { startDate: START_DATE } }),
      server: {
        methods: {
          cachedServiceRequest: sandbox.stub()
        }
      },
      pre: { draftChargeInformation: { dateRange: { startDate: START_DATE } } }
    };

    sandbox.stub(services.water.changeReasons, 'getChangeReasons').resolves([
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
    ]);

    sandbox.stub(services.water.chargeVersionWorkflows, 'getChargeVersionWorkflows').resolves({
      data: []
    });

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

    sandbox.stub(services.water.chargeVersions, 'getDefaultChargesForLicenceVersion').resolves({
      data: [
        { source: 'unsupported' }
      ]
    });

    sandbox.stub(services.water.chargeVersions, 'getChargeVersion').resolves({
      id: 'test-charge-version-id',
      status: 'current'
    });

    sandbox.stub(services.water.chargeVersionWorkflows, 'getChargeVersionWorkflow').resolves({
      chargeVersionWorkflow: {
        id: 'test-charge-version-workflow-id',
        status: 'review',
        chargeVersion: {
          id: 'test-charge-version-id',
          invoiceAccount: {
            invoiceAccountAddresses: [{
              id: 'test-invoice-account-address-id'
            }]
          }
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

  experiment('.loadBillingAccounts', () => {
    beforeEach(async () => {
      request.pre = {
        licence: {
          id: 'test-licence-id',
          licenceNumber: '123/123'
        },
        draftChargeInformation: {
          dateRange: {
            startDate: '2000-01-01'
          }
        }
      };
    });

    experiment('when data is found', () => {
      beforeEach(async () => {
        result = await preHandlers.loadBillingAccounts(request);
      });

      test('the licence number and start date are used to get the licence accounts', async () => {
        const [licenceNumber, startDate] = services.water.licences.getLicenceAccountsByRefAndDate.lastCall.args;
        expect(licenceNumber).to.equal(request.pre.licence.licenceNumber);
        expect(startDate).to.equal(request.pre.draftChargeInformation.dateRange.startDate);
      });
    });

    experiment('when the data is not found', () => {
      beforeEach(async () => {
        const err = new Error();
        err.statusCode = 404;
        services.water.licences.getLicenceAccountsByRefAndDate.rejects(err);
        result = await preHandlers.loadBillingAccounts(request);
      });

      test('resolves with a Boom 404 error', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
        expect(result.message).to.equal('Cannot load billing accounts for licence test-licence-id');
      });
    });

    experiment('for other errors', () => {
      beforeEach(async () => {
        const err = new Error('Oh no!');
        services.water.licences.getLicenceAccountsByRefAndDate.rejects(err);
      });

      test('rejects with the error', async () => {
        const func = () => preHandlers.loadBillingAccounts(request);
        const err = await expect(func()).to.reject();
        expect(err.message).to.equal('Oh no!');
      });
    });
  });

  experiment('loadLicencesWithoutChargeVersions', () => {
    experiment('when the service response is valid', async () => {
      beforeEach(async () => {
        result = await preHandlers.loadLicencesWithoutChargeVersions(request);
      });
      // calls the service method
      test('calls the service method', async () => {
        expect(services.water.chargeVersionWorkflows.getLicencesWithoutChargeInformation.called).to.be.true();
      });
      test('returns an array', async () => {
        expect(Array.isArray(result)).to.be.true();
      });
    });
    experiment('when the service response is invalid', async () => {
      beforeEach(async () => {
        const err = new Error();
        err.statusCode = 404;
        services.water.chargeVersionWorkflows.getLicencesWithoutChargeInformation.rejects(err);
        result = await preHandlers.loadLicencesWithoutChargeVersions(request);
      });
      // calls the service method
      test('calls the service method', async () => {
        expect(services.water.chargeVersionWorkflows.getLicencesWithoutChargeInformation.called).to.be.true();
      });
      test('returns an error', async () => {
        expect(result.message).to.equal('Could not retrieve list of licences without charge versions.');
      });
    });
  });

  experiment('loadLicencesWithWorkflowsInProgress', () => {
    experiment('when the service response is valid', async () => {
      beforeEach(async () => {
        result = await preHandlers.loadLicencesWithWorkflowsInProgress(request);
      });
      // calls the service method
      test('calls the service method', async () => {
        expect(services.water.chargeVersionWorkflows.getChargeVersionWorkflows.called).to.be.true();
      });
      test('returns an array', async () => {
        expect(Array.isArray(result)).to.be.true();
      });
    });
    experiment('when the service response is invalid', async () => {
      beforeEach(async () => {
        const err = new Error();
        err.statusCode = 404;
        services.water.chargeVersionWorkflows.getChargeVersionWorkflows.rejects(err);
        result = await preHandlers.loadLicencesWithWorkflowsInProgress(request);
      });
      // calls the service method
      test('calls the service method', async () => {
        expect(services.water.chargeVersionWorkflows.getChargeVersionWorkflows.called).to.be.true();
      });
      test('returns an error', async () => {
        expect(result.message).to.equal('Could not retrieve licences with pending charge versions.');
      });
    });
  });

  experiment('.loadIsChargeable', () => {
    test('returns true if the change reason is new_chargeable_charge_version', async () => {
      request.pre = {
        draftChargeInformation: {
          changeReason: {
            type: 'new_chargeable_charge_version'
          }
        }
      };

      result = await preHandlers.loadIsChargeable(request);

      expect(result).to.equal(true);
    });

    test('returns true if the change reason is new_non_chargeable_charge_version', async () => {
      request.pre = {
        draftChargeInformation: {
          changeReason: {
            type: 'new_non_chargeable_charge_version'
          }
        }
      };

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
  });

  experiment('.loadChargeVersionWorkflow', () => {
    beforeEach(async () => {
      request.params.chargeVersionWorkflowId = 'test-charge-version-workflow-id';
    });

    experiment('when data is found', () => {
      beforeEach(async () => {
        result = await preHandlers.loadChargeVersionWorkflow(request);
      });

      test('the charge version workflow is retrieved by its id', async () => {
        const [id] = services.water.chargeVersionWorkflows.getChargeVersionWorkflow.lastCall.args;
        expect(id).to.equal(request.params.chargeVersionWorkflowId);
      });

      test('the charge version data is saved in the session', async () => {
        const [licenceId, chargeVersion] = request.setDraftChargeInformation.lastCall.args;
        expect(licenceId).to.equal(request.params.licenceId);
        expect(chargeVersion.id).to.equal('test-charge-version-id');
      });

      test('the charge version data is mapped to the shape expected by the UI', async () => {
        const [, chargeVersion] = request.setDraftChargeInformation.lastCall.args;
        expect(chargeVersion.status).to.equal('review');
        expect(chargeVersion.invoiceAccount.invoiceAccountAddress).to.equal('test-invoice-account-address-id');
      });
    });

    experiment('when the data is not found', () => {
      beforeEach(async () => {
        const err = new Error();
        err.statusCode = 404;
        services.water.chargeVersionWorkflows.getChargeVersionWorkflow.rejects(err);
        result = await preHandlers.loadChargeVersionWorkflow(request);
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

  experiment('.saveInvoiceAccount', () => {
    experiment('when invoice account id is present', () => {
      beforeEach(async () => {
        result = await preHandlers.saveInvoiceAccount(request);
      });

      test('the invoice account is not retrieved', async () => {
        expect(
          services.water.invoiceAccounts.getInvoiceAccount.called
        ).to.be.false();
      });
    });

    experiment('when invoice account id is present', () => {
      experiment('and the data is not found', () => {
        beforeEach(async () => {
          request.query.invoiceAccountId = 'test-invoice-account-id';
          result = await preHandlers.saveInvoiceAccount(request);
        });

        test('the invoice account is retrieved by id', async () => {
          const [id] = services.water.invoiceAccounts.getInvoiceAccount.lastCall.args;
          expect(id).to.equal(request.query.invoiceAccountId);
        });

        test('the invoice account is saved in the session', async () => {
          const [licenceId, chargeInfo] = request.setDraftChargeInformation.lastCall.args;
          expect(licenceId).to.equal(request.params.licenceId);
          expect(chargeInfo).to.be.an.object();
        });

        test('the invoice account is saved in the session', async () => {
          const [, chargeInfo] = request.setDraftChargeInformation.lastCall.args;
          expect(chargeInfo.invoiceAccount).to.equal({
            id: 'test-invoice-account-id',
            invoiceAccountAddresses: [{
              id: 'test-invoice-account-address-id'
            }],
            invoiceAccountAddress: 'test-invoice-account-address-id'
          });
        });
      });

      experiment('and the data is not found', () => {
        beforeEach(async () => {
          const err = new Error();
          err.statusCode = 404;
          services.water.invoiceAccounts.getInvoiceAccount.rejects(err);
          request.query.invoiceAccountId = 'test-invoice-account-id';
          result = await preHandlers.saveInvoiceAccount(request);
        });

        test('resolves with a Boom 404 error', async () => {
          expect(result.isBoom).to.be.true();
          expect(result.output.statusCode).to.equal(404);
          expect(result.message).to.equal('Cannot load invoice account test-invoice-account-id');
        });
      });
    });

    experiment('for other errors', () => {
      beforeEach(async () => {
        const err = new Error('Oh no!');
        services.water.invoiceAccounts.getInvoiceAccount.rejects(err);
      });

      test('rejects with the error', async () => {
        request.query.invoiceAccountId = 'test-invoice-account-id';
        const func = () => preHandlers.saveInvoiceAccount(request);
        const err = await expect(func()).to.reject();
        expect(err.message).to.equal('Oh no!');
      });
    });
  });
});
