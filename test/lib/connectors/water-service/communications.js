const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();

const serviceRequest = require('../../../../src/lib/connectors/service-request');
const communicationsConnector = require('../../../../src/lib/connectors/water-service/communications');

experiment('getCommunication', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the expected URL to the request', async () => {
    await communicationsConnector.getCommunication('test-id');
    const expectedUrl = `${process.env.WATER_URI}/communications/test-id`;
    const [url] = serviceRequest.get.lastCall.args;
    expect(url).to.equal(expectedUrl);
  });
});
