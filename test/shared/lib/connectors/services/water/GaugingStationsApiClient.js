const GaugingStationsApiClient = require('shared/lib/connectors/services/water/GaugingStationsApiClient');

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { serviceRequest } = require('@envage/water-abstraction-helpers');

const { expect } = require('@hapi/code');

experiment('shared/services/GaugingStationsApiClient', () => {
  let client;

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves();
    sandbox.stub(serviceRequest, 'patch').resolves();
    sandbox.stub(serviceRequest, 'post').resolves();

    client = new GaugingStationsApiClient('https://example.com/api');
  });

  afterEach(async () => sandbox.restore());

  experiment('.getGaugingStationbyId', () => {
    test('calls the expected URL', async () => {
      await client.getGaugingStationbyId('ms-id');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/api/gauging-stations/ms-id');
    });
  });
});
