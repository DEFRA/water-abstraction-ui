const { expect } = require('code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const waterConnector = require('internal/lib/connectors/water');
const serviceRequest = require('shared/lib/connectors/service-request');
const config = require('internal/config');

beforeEach(async () => {
  sandbox.stub(serviceRequest, 'get').resolves();
  sandbox.stub(serviceRequest, 'post').resolves();
});

afterEach(async () => {
  sandbox.restore();
});

experiment('getRiverLevel', () => {
  test('uses the expected url', async () => {
    await waterConnector.getRiverLevel('test-station');
    const [url] = serviceRequest.get.lastCall.args;
    expect(url).to.equal(`${config.services.water}/river-levels/station/test-station`);
  });
});
