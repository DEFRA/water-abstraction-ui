const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('lab').script();
const { expect } = require('code');

const ServiceStatusService = require('shared/lib/connectors/services/water/ServiceStatusService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('services/water/ServiceStatusService', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getServiceStatus', () => {
    test('passes the expected URL to the service request', async () => {
      const service = new ServiceStatusService('http://127.0.0.1:8001/water/1.0');
      await service.getServiceStatus();
      const expectedUrl = `http://127.0.0.1:8001/water/1.0/service-status`;
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });
  });
});
