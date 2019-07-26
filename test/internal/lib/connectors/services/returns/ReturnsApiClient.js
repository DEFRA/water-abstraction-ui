const ReturnsApiClient = require('internal/lib/connectors/services/returns/ReturnsApiClient');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

experiment('internal/services/ReturnsApiClient', () => {
  let logger;
  let config;
  let client;

  beforeEach(async () => {
    logger = {};
    config = {
      jwt: {
        token: 'test-jwt-token'
      },
      services: {
        returns: 'https://example.com/returns'
      }
    };

    client = new ReturnsApiClient(config, logger);
    sandbox.stub(serviceRequest, 'get').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('construction', () => {
    test('creates the expected endpoint URL', async () => {
      expect(client.getUrl()).to.equal('https://example.com/returns/returns');
    });

    test('sets the JWT in the client headers', async () => {
      expect(client.config.headers.Authorization).to.equal('test-jwt-token');
    });

    test('adds the base service URL to the config', async () => {
      expect(client.config.serviceUrl).to.equal('https://example.com/returns');
    });
  });

  experiment('.getReport', () => {
    test('calls expected URL for a user details report request', async () => {
      await client.getReport('userDetails');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/returns/reports/user-details');
    });

    test('calls expected URL for a return statuses report request', async () => {
      await client.getReport('statuses');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/returns/reports/return-statuses');
    });

    test('calls expected URL for a licence-count report request', async () => {
      await client.getReport('licenceCount');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/returns/reports/licence-count');
    });

    test('calls expected URL for a returns frequencies request', async () => {
      await client.getReport('frequencies');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/returns/reports/returns-frequencies');
    });

    test('defaults to water abstraction licences in the filter', async () => {
      await client.getReport('frequencies');
      const [, options] = serviceRequest.get.lastCall.args;

      const filter = JSON.parse(options.qs.filter);
      expect(filter.regime).to.equal('water');
      expect(filter.licence_type).to.equal('abstraction');
    });

    test('additional filter params can be specified', async () => {
      await client.getReport('frequencies', { end_date: '2018-10-31' });
      const [, options] = serviceRequest.get.lastCall.args;

      const filter = JSON.parse(options.qs.filter);
      expect(filter.regime).to.equal('water');
      expect(filter.licence_type).to.equal('abstraction');
      expect(filter.end_date).to.equal('2018-10-31');
    });
  });
});
