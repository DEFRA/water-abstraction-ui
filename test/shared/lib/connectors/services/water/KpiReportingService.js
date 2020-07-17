const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const KpiReportingService = require('shared/lib/connectors/services/water/KpiReportingService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('services/water/KpiReportingService', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getKpiData', () => {
    test('passes the expected URL to the service request', async () => {
      const service = new KpiReportingService('http://127.0.0.1:8001/water/1.0');
      await service.getKpiData();
      const expectedUrl = `http://127.0.0.1:8001/water/1.0/kpi-reporting`;
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });
  });
});
