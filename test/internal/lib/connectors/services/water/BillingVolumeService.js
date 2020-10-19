const uuid = require('uuid/v4');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const BillingVolumeService = require('internal/lib/connectors/services/water/BillingVolumeService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('services/water/BillingVolumeService', () => {
  let service;

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get');
    sandbox.stub(serviceRequest, 'patch');

    service = new BillingVolumeService('https://example.com/water/1.0');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getBillingVolume', () => {
    test('passes the expected URL to the service request', async () => {
      const billingVolumeId = uuid();
      await service.getBillingVolume(billingVolumeId);
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/billing/volumes/${billingVolumeId}`);
    });
  });

  experiment('.updateVolume', () => {
    test('passes the expected URL and payload to the service request', async () => {
      const billingVolumeId = uuid();
      await service.updateVolume(billingVolumeId, 123);
      const [url, options] = serviceRequest.patch.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/billing/volumes/${billingVolumeId}`);
      expect(options.body.volume).to.equal(123);
    });
  });
});
