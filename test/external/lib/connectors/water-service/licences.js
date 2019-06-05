const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();

const config = require('../../../../../src/external/config');
const serviceRequest = require('../../../../../src/shared/lib/connectors/service-request');
const licencesConnector = require('../../../../../src/external/lib/connectors/water-service/licences');

const userResponses = require('../../../responses/water-service/documents/_documentId_/licence/users');

experiment('getLicenceByDocumentId', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the expected URL to the request', async () => {
    await licencesConnector.getLicenceByDocumentId('test-id');
    const expectedUrl = `${config.services.water}/documents/test-id/licence`;
    const [url] = serviceRequest.get.lastCall.args;
    expect(url).to.equal(expectedUrl);
  });

  test('allows expired licences to be included', async () => {
    await licencesConnector.getLicenceByDocumentId('test-id', true);
    const expectedUrl = `${config.services.water}/documents/test-id/licence?includeExpired=true`;
    const [url] = serviceRequest.get.lastCall.args;
    expect(url).to.equal(expectedUrl);
  });
});

experiment('getLicenceUsersByDocumentId', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the expected URL to the request', async () => {
    await licencesConnector.getLicenceUsersByDocumentId('test-id');
    const expectedUrl = `${config.services.water}/documents/test-id/licence/users`;
    const [url] = serviceRequest.get.lastCall.args;
    expect(url).to.equal(expectedUrl);
  });
});

experiment('getLicencePointsByDocumentId', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the expected URL to the request', async () => {
    await licencesConnector.getLicencePointsByDocumentId('test-id');
    const expectedUrl = `${config.services.water}/documents/test-id/licence/points`;
    const [url] = serviceRequest.get.lastCall.args;
    expect(url).to.equal(expectedUrl);
  });
});

experiment('getLicenceConditionsByDocumentId', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the expected URL to the request', async () => {
    await licencesConnector.getLicenceConditionsByDocumentId('test-id');
    const expectedUrl = `${config.services.water}/documents/test-id/licence/conditions`;
    const [url] = serviceRequest.get.lastCall.args;
    expect(url).to.equal(expectedUrl);
  });
});

experiment('getLicencePrimaryUserByDocumentId', async () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('returns undefined when the document is not found', async () => {
    serviceRequest.get.resolves(userResponses.notFound());
    const user = await licencesConnector.getLicencePrimaryUserByDocumentId('test-id');

    expect(user).to.be.undefined();
  });

  test('returns undefined when there is not primary user', async () => {
    serviceRequest.get.resolves(userResponses.multipleUsersExcludingPrimaryUser());
    const user = await licencesConnector.getLicencePrimaryUserByDocumentId('test-id');

    expect(user).to.be.undefined();
  });

  test('returns the expected user when there is a primary user', async () => {
    serviceRequest.get.resolves(userResponses.multipleUsersIncludingPrimaryUser());
    const user = await licencesConnector.getLicencePrimaryUserByDocumentId('test-id');

    expect(user).to.be.equal({
      userId: 4444,
      entityId: '44444444-0000-0000-0000-000000000000',
      userName: 'test4@example.com',
      roles: ['primary_user']
    });
  });
});

experiment('getLicenceCommunicationsByDocumentId', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the expected URL to the request', async () => {
    await licencesConnector.getLicenceCommunicationsByDocumentId('test-id');
    const expectedUrl = `${config.services.water}/documents/test-id/licence/communications`;
    const [url] = serviceRequest.get.lastCall.args;
    expect(url).to.equal(expectedUrl);
  });

  test('allows expired licences to be included', async () => {
    await licencesConnector.getLicenceCommunicationsByDocumentId('test-id', true);
    const expectedUrl = `${config.services.water}/documents/test-id/licence/communications?includeExpired=true`;
    const [url] = serviceRequest.get.lastCall.args;
    expect(url).to.equal(expectedUrl);
  });
});
