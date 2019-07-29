const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const InternalSearchService = require('internal/lib/connectors/services/water/InternalSearchService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('services/water/InternalSearchService', () => {
  let service;

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get');
    service = new InternalSearchService('http://127.0.0.1:8001/water/1.0');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getInternalSearchResults', () => {
    test('passes the expected URL to the service request', async () => {
      await service.getInternalSearchResults('search-query');
      const expectedUrl = 'http://127.0.0.1:8001/water/1.0/internal-search';
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });

    test('passes the query on the query string', async () => {
      await service.getInternalSearchResults('search-query');
      const [, options] = serviceRequest.get.lastCall.args;
      expect(options.qs.query).to.equal('search-query');
    });

    test('by default sets the page to 1', async () => {
      await service.getInternalSearchResults('search-query');
      const [, options] = serviceRequest.get.lastCall.args;
      expect(options.qs.page).to.equal(1);
    });

    test('page can be overridden', async () => {
      await service.getInternalSearchResults('search-query', 100);
      const [, options] = serviceRequest.get.lastCall.args;
      expect(options.qs.page).to.equal(100);
    });
  });
});
