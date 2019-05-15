const { expect } = require('code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const waterConnector = require('../../../../src/external/lib/connectors/water');
const serviceRequest = require('../../../../src/external/lib/connectors/service-request');
const config = require('../../../../src/external/config');

beforeEach(async () => {
  sandbox.stub(serviceRequest, 'get').resolves();
  sandbox.stub(serviceRequest, 'post').resolves();
});

afterEach(async () => {
  sandbox.restore();
});

experiment('sendNotifyMessage', () => {
  let recipient;
  let personalisation;

  beforeEach(async () => {
    recipient = { to: 'test@example.com' };
    personalisation = { address: 'test-address' };
  });

  test('uses the expected url', async () => {
    await waterConnector.sendNotifyMessage('test-ref', recipient, personalisation);
    const [url] = serviceRequest.post.lastCall.args;
    expect(url).to.equal(`${config.services.water}/notify/test-ref`);
  });

  test('passes the expected body', async () => {
    await waterConnector.sendNotifyMessage('test-ref', recipient, personalisation);
    const [, body] = serviceRequest.post.lastCall.args;
    expect(body).to.equal({
      body: {
        recipient: {
          to: 'test@example.com'
        },
        personalisation: {
          address: 'test-address'
        }
      }
    });
  });

  test('returns the response body on success', async () => {
    serviceRequest.post.resolves({
      body: 'body-content'
    });

    const data = await waterConnector.sendNotifyMessage('test-ref', recipient, personalisation);

    expect(data).to.equal('body-content');
  });

  test('returns the response body on failure', async () => {
    serviceRequest.post.rejects({
      error: 'bad news'
    });

    const response = await waterConnector.sendNotifyMessage('test-ref', recipient, personalisation);

    expect(response).to.equal({ error: 'bad news' });
  });
});

experiment('sendNotification', () => {
  const taskConfigId = 'test-config-id';
  const licenceNumbers = ['123', '456'];
  const params = { one: 1 };
  const sender = 'test-sender';

  test('uses the preview url when no sender', async () => {
    await waterConnector.sendNotification(taskConfigId, licenceNumbers, params);
    const [url] = serviceRequest.post.lastCall.args;

    expect(url).to.equal(`${config.services.water}/notification/preview`);
  });

  test('uses the send url when a sender is passed', async () => {
    await waterConnector.sendNotification(taskConfigId, licenceNumbers, params, sender);
    const [url] = serviceRequest.post.lastCall.args;

    expect(url).to.equal(`${config.services.water}/notification/send`);
  });

  test('passes the expected body', async () => {
    await waterConnector.sendNotification(taskConfigId, licenceNumbers, params, sender);
    const [, options] = serviceRequest.post.lastCall.args;

    expect(options).to.equal({
      body: {
        filter: {
          system_external_id: {
            $in: licenceNumbers
          }
        },
        taskConfigId,
        params,
        sender
      }
    });
  });
});

experiment('getRiverLevel', () => {
  test('uses the expected url', async () => {
    await waterConnector.getRiverLevel('test-station');
    const [url] = serviceRequest.get.lastCall.args;
    expect(url).to.equal(`${config.services.water}/river-levels/station/test-station`);
  });
});
