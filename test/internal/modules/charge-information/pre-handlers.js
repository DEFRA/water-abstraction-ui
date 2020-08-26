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

  beforeEach(async () => {
    request = {
      params: {
        licenceId: 'test-licence-id'
      },
      server: {
        methods: {
          cachedServiceRequest: sandbox.stub(),
          getDraftChargeInformation: sandbox.stub()
        }
      }
    };

    sandbox.stub(services.water.changeReasons, 'getChangeReasons').resolves({
      data: [{
        changeReasonId: 'test-change-reason-id'
      }]
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
    experiment('when data is found', () => {
      beforeEach(async () => {
        request.server.methods.getDraftChargeInformation.resolves({
          startDate: '2020-01-01'
        });

        result = await preHandlers.loadDraftChargeInformation(request);
      });

      test('the server method is called with the licence ID', async () => {
        expect(request.server.methods.getDraftChargeInformation.calledWith(
          'test-licence-id'
        )).to.be.true();
      });

      test('resolves with cache data', async () => {
        expect(result.startDate).to.equal('2020-01-01');
      });
    });

    experiment('when the data is not found', () => {
      beforeEach(async () => {
        const err = new Error();
        err.statusCode = 404;
        request.server.methods.getDraftChargeInformation.rejects(err);
        result = await preHandlers.loadDraftChargeInformation(request);
      });

      test('resolves with a Boom 404 error', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
        expect(result.message).to.equal('Draft charge information not found for licence test-licence-id');
      });
    });

    experiment('for other errors', () => {
      beforeEach(async () => {
        const err = new Error('Oh no!');
        request.server.methods.getDraftChargeInformation.rejects(err);
      });

      test('rejects with the error', async () => {
        const func = () => preHandlers.loadDraftChargeInformation(request);
        const err = await expect(func()).to.reject();
        expect(err.message).to.equal('Oh no!');
      });
    });
  });

  experiment('loadChangeReasons', () => {
    experiment('when data is found', () => {
      beforeEach(async () => {
        result = await preHandlers.loadChangeReasons(request);
      });

      test('the service method is called', async () => {
        expect(
          services.water.changeReasons.getChangeReasons.called
        ).to.be.true();
      });

      test('resolves with reasons data', async () => {
        expect(result).to.be.an.array().length(1);
        expect(result[0].changeReasonId).to.equal('test-change-reason-id');
      });
    });

    experiment('when the data is not found', () => {
      beforeEach(async () => {
        const err = new Error();
        err.statusCode = 404;
        services.water.changeReasons.getChangeReasons.rejects(err);
        result = await preHandlers.loadChangeReasons(request);
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
        const func = () => preHandlers.loadChangeReasons(request);
        const err = await expect(func()).to.reject();
        expect(err.message).to.equal('Oh no!');
      });
    });
  });
});
