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
      getDraftChargeInformation: sandbox.stub().returns({ dateRange: { startDate: START_DATE } }),
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
          changeReasonId: 'test-change-reason-id-1',
          type: 'new_chargeable_charge_version'
        },
        {
          changeReasonId: 'test-change-reason-id-2',
          type: 'new_non_chargeable_charge_version'
        },
        {
          changeReasonId: 'test-change-reason-id-3',
          type: 'new_non_chargeable_charge_version'
        }
      ]
    });

    sandbox.stub(services.water.chargeVersionWorkflows, 'getChargeVersionWorkflow').resolves({
      data: []
    });

    sandbox.stub(services.water.licences, 'getLicenceVersions').resolves([
      { id: 'test-licence-version-1', status: 'superceded', issue: 2, increment: 0, startDate: START_DATE, endDate: '2018-01-16' },
      { id: 'test-licence-version-2', status: 'current', issue: 2, increment: 1, startDate: START_DATE, endDate: null }
    ]);

    sandbox.stub(services.water.licences, 'getLicenceAccountsByRefAndDate').resolves([
      { id: 'test-licence-account-1' },
      { id: 'test-licence-account-2' }
    ]);

    sandbox.stub(services.water.chargeVersions, 'getDefaultChargesForLicenceVersion').resolves({
      data: [
        { source: 'unsupported' }
      ]
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('loadLicence', () => {
    experiment('when data is found', () => {
      beforeEach(async () => {
        request.server.methods.cachedServiceRequest.resolves({
          licenceId: 'test-licence-id',
          licenceNumber: '01/123'
        });

        result = await preHandlers.loadLicence(request);
      });

      test('the server method is called with the licence ID', async () => {
        expect(request.server.methods.cachedServiceRequest.calledWith(
          'water.licences.getLicenceById', 'test-licence-id'
        )).to.be.true();
      });

      test('resolves with licence data', async () => {
        expect(result.licenceNumber).to.equal('01/123');
      });
    });

    experiment('when the licence is not found', () => {
      beforeEach(async () => {
        const err = new Error();
        err.statusCode = 404;
        request.server.methods.cachedServiceRequest.rejects(err);
        result = await preHandlers.loadLicence(request);
      });

      test('resolves with a Boom 404 error', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
        expect(result.message).to.equal('Licence test-licence-id not found');
      });
    });

    experiment('for other errors', () => {
      beforeEach(async () => {
        const err = new Error('Oh no!');
        request.server.methods.cachedServiceRequest.rejects(err);
      });

      test('rejects with the error', async () => {
        const func = () => preHandlers.loadLicence(request);
        const err = await expect(func()).to.reject();
        expect(err.message).to.equal('Oh no!');
      });
    });
  });

  experiment('loadDraftChargeInformation', () => {
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

  experiment('loadChargeableChangeReasons', () => {
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
        expect(result[0].changeReasonId).to.equal('test-change-reason-id-1');
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

  experiment('loadNonChargeableChangeReasons', () => {
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
        expect(result[0].changeReasonId).to.equal('test-change-reason-id-2');
        expect(result[1].changeReasonId).to.equal('test-change-reason-id-3');
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

  experiment('loadDefaultCharges', () => {
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

  experiment('loadBillingAccounts', () => {
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

  experiment('loadIsChargeable', () => {
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

  experiment('loadLicencesWithWorkflowsInProgress', () => {
    experiment('when the service response is valid', async () => {
      beforeEach(async () => {
        result = await preHandlers.loadLicencesWithWorkflowsInProgress(request);
      });
      // calls the service method
      test('calls the service method', async () => {
        expect(services.water.chargeVersionWorkflows.getChargeVersionWorkflow.called).to.be.true();
      });
      test('returns an array', async () => {
        expect(Array.isArray(result)).to.be.true();
      });
    });
  });
});
