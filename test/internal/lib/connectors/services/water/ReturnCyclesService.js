const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');

const ReturnCyclesService = require('internal/lib/connectors/services/water/ReturnCyclesService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('services/water/ReturnCyclesService', () => {
  let service;
  const baseUrl = 'https://example.com';
  const returnCycleId = 'test-id';

  beforeEach(async () => {
    service = new ReturnCyclesService(baseUrl);
    sandbox.stub(serviceRequest, 'get');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getReport', () => {
    test('calls the correct URL', async () => {
      await service.getReport();
      expect(serviceRequest.get.calledWith(
        `${baseUrl}/return-cycles/report`
      )).to.be.true();
    });
  });

  experiment('.getReturnCycleById', () => {
    test('calls the correct URL', async () => {
      await service.getReturnCycleById(returnCycleId);
      expect(serviceRequest.get.calledWith(
        `${baseUrl}/return-cycles/${returnCycleId}`
      )).to.be.true();
    });
  });

  experiment('.getReturnCycleReturns', () => {
    test('calls the correct URL', async () => {
      await service.getReturnCycleReturns(returnCycleId);
      expect(serviceRequest.get.calledWith(
        `${baseUrl}/return-cycles/${returnCycleId}/returns`
      )).to.be.true();
    });
  });
});
