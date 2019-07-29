const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

const {
  experiment,
  beforeEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

experiment('ServiceClient', () => {
  experiment('construction', () => {
    let serviceClient;
    let logger;

    beforeEach(async () => {
      logger = { log: () => 'test-log' };
      serviceClient = new ServiceClient('https://example.com:8001', logger);
    });

    test('initializes the service endpoint', async () => {
      expect(serviceClient.serviceEndpoint).to.equal('https://example.com:8001');
    });

    test('initializes the logger', async () => {
      expect(serviceClient.logger.log()).to.equal('test-log');
    });

    test('initializes the serviceRequest', async () => {
      expect(serviceClient.serviceRequest.get).to.be.a.function();
    });
  });

  experiment('joinUrl', () => {
    test('creates the expected url', async () => {
      const client = new ServiceClient('https://example.com:8001');
      const url = client.joinUrl('123');
      expect(url).to.equal('https://example.com:8001/123');
    });

    test('handles numbers', async () => {
      const client = new ServiceClient('https://example.com:8001');
      const url = client.joinUrl(123);
      expect(url).to.equal('https://example.com:8001/123');
    });

    test('can be empty', async () => {
      const client = new ServiceClient('https://example.com:8001');
      const url = client.joinUrl();
      expect(url).to.equal('https://example.com:8001');
    });

    test('handles many parts', async () => {
      const client = new ServiceClient('https://example.com:8001');
      const url = client.joinUrl(1, 'two', 3);
      expect(url).to.equal('https://example.com:8001/1/two/3');
    });
  });
});
