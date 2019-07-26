const CommunicationsService = require('shared/lib/connectors/services/water/CommunicationsService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

experiment('services/water/CommunicationsService', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getCommunication', () => {
    test('calls service request with the correct url', async () => {
      const service = new CommunicationsService('https://example.com');
      await service.getCommunication('123');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/communications/123');
    });
  });
});
