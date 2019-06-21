const RiverLevelsService = require('shared/lib/connectors/services/water/RiverLevelsService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('lab').script();
const { expect } = require('code');

experiment('services/water/RiverLevelsService', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getRiverLevel', () => {
    test('calls service request with the correct url', async () => {
      const service = new RiverLevelsService('https://example.com');
      await service.getRiverLevel('123');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/river-levels/station/123');
    });
  });
});
