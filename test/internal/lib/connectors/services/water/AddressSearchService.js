const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const AddressSearchService = require('internal/lib/connectors/services/water/AddressSearchService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('services/water/AddressSearchService', () => {
  let service;

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get');
    service = new AddressSearchService('http://127.0.0.1:8001/water/1.0');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getAddressSearchResults', () => {
    beforeEach(async () => {
      await service.getAddressSearchResults('TT1 1TT');
    });

    test('passes the expected URL to the service request', async () => {
      const expectedUrl = 'http://127.0.0.1:8001/water/1.0/address-search';
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });

    test('passes the query on the query string', async () => {
      const [, options] = serviceRequest.get.lastCall.args;
      expect(options.qs.q).to.equal('TT1 1TT');
    });
  });
});
