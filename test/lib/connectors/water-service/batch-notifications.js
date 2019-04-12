const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { expect } = require('code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('lab').script();

const config = require('../../../../config');
const serviceRequest = require('../../../../src/lib/connectors/service-request');
const batchNotificationsConnector = require('../../../../src/lib/connectors/water-service/batch-notifications');

experiment('prepareReturnsReminders', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'post').resolves({});
    await batchNotificationsConnector.prepareReturnsReminders('issuer', '1,2');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the expected URL to the request', async () => {
    const [url] = serviceRequest.post.lastCall.args;
    expect(url).to.equal(`${config.services.water}/batch-notifications/prepare/returnReminder`);
  });

  test('adds the issuer to the request body', async () => {
    const [, options] = serviceRequest.post.lastCall.args;
    expect(options.body.issuer).to.equal('issuer');
  });

  test('adds the exclude licences values to the request body', async () => {
    const [, options] = serviceRequest.post.lastCall.args;
    expect(options.body.data.excludeLicences).to.equal('1,2');
  });
});

experiment('sendReturnsReminders', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'post').resolves({});
    await batchNotificationsConnector.sendReturnsReminders('test-event-id', 'issuer');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the expected URL to the request', async () => {
    const [url] = serviceRequest.post.lastCall.args;
    expect(url).to.equal(`${config.services.water}/batch-notifications/send/test-event-id`);
  });

  test('includes the issuer in the request body', async () => {
    const [, options] = serviceRequest.post.lastCall.args;
    expect(options.body.issuer).to.equal('issuer');
  });
});
