'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const services = require('internal/lib/connectors/services');

const preHandlers = require('internal/modules/address-entry/pre-handlers');

const POST_CODE = 'TT1 1TT';
const ADDRESS = {
  addressLine1: 'Line 1',
  addressLine2: 'Line 2',
  addressLine3: 'Line 3',
  postcode: POST_CODE
};

const INVALID_ADDRESS = {
  addressLine1: 'Line 1',
  addressLine2: null,
  addressLine3: null,
  postcode: POST_CODE
};

experiment('src/internal/modules/address-entry/pre-handlers .searchForAddressesByPostcode', () => {
  let stub;
  const request = {
    query: {
      postcode: POST_CODE
    }
  };

  beforeEach(async () => {
    stub = sandbox.stub(services.water.addressSearch, 'getAddressSearchResults');
  });

  afterEach(() => sandbox.restore());

  function addressSearch (addresses = []) {
    stub.resolves({ data: [ADDRESS, ADDRESS, ...addresses] });

    return preHandlers.searchForAddressesByPostcode(request);
  }

  test('calls the address search with the postcode', async () => {
    await addressSearch();
    const [postcode] = services.water.addressSearch.getAddressSearchResults.lastCall.args;
    expect(postcode).to.equal(POST_CODE);
  });

  test('returns the data from the address search', async () => {
    const result = await addressSearch();
    expect(result).to.equal([ ADDRESS, ADDRESS ]);
  });

  test('returns a Boom not found error if a 404 is returned', async () => {
    const err = new Error();
    err.statusCode = 404;
    services.water.addressSearch.getAddressSearchResults
      .rejects(err);

    const result = await preHandlers.searchForAddressesByPostcode(request);

    expect(result.isBoom).to.be.true();
    expect(result.message).to.equal(`No addresses found for postcode ${POST_CODE}`);
  });

  test('throws error if an unexpected error is returned', async () => {
    const error = new Error('oops');
    services.water.addressSearch.getAddressSearchResults
      .rejects(error);
    try {
      await preHandlers.searchForAddressesByPostcode(request);
    } catch (err) {
      expect(err).to.equal(error);
    }
  });
});
