const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const ChargeVersionsService = require('shared/lib/connectors/services/water/ChargeVersionsService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('services/water/ChargeVersionsService', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getChargeVersionsByLicenceId', () => {
    test('passes the expected URL to the service request', async () => {
      const service = new ChargeVersionsService('http://127.0.0.1:8001/water/1.0');
      await service.getChargeVersionsByLicenceId('licence-id');
      const expectedUrl = `http://127.0.0.1:8001/water/1.0/charge-versions/licence/licence-id`;
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });
  });

  experiment('.getChargeVersionsByDocumentId', () => {
    test('passes the expected URL to the service request', async () => {
      const service = new ChargeVersionsService('http://127.0.0.1:8001/water/1.0');
      await service.getChargeVersionsByDocumentId('doc-id');
      const expectedUrl = `http://127.0.0.1:8001/water/1.0/charge-versions/document/doc-id`;
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });
  });

  experiment('.getChargeVersion', () => {
    test('passes the expected URL to the service request', async () => {
      const service = new ChargeVersionsService('http://127.0.0.1:8001/water/1.0');
      await service.getChargeVersion('charge-version-id');
      const expectedUrl = `http://127.0.0.1:8001/water/1.0/charge-versions/charge-version-id`;
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });
  });

  experiment('.getDefaultChargesForLicenceVersion', () => {
    test('passes the expected URL to the service request', async () => {
      const service = new ChargeVersionsService('http://127.0.0.1:8001/water/1.0');
      await service.getDefaultChargesForLicenceVersion('licence-version-id');

      const expectedUrl = `http://127.0.0.1:8001/water/1.0/charge-versions/default/licence-version-id`;
      const [url] = serviceRequest.get.lastCall.args;

      expect(url).to.equal(expectedUrl);
    });
  });
});
