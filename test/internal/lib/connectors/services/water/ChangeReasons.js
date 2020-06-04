const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const ChangeReasonsService = require('internal/lib/connectors/services/water/ChangeReasonsService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('services/water/ChangeReasons', () => {
  let service;

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get');
    service = new ChangeReasonsService('https://example.com/water/1.0');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getChangeReasons', () => {
    test('passes the expected URL to the service request', async () => {
      await service.getChangeReasons();
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(`https://example.com/water/1.0/change-reasons`);
    });
  });
});
