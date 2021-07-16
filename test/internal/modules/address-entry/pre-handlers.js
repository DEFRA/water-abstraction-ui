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
const ADDRESS1 = {
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
  let request, result;
  beforeEach(async () => {
    sandbox.stub(services.water.addressSearch, 'getAddressSearchResults')
      .resolves({ data: [ADDRESS1, INVALID_ADDRESS] });

    request = {
      query: {
        postcode: POST_CODE
      }
    };
    result = await preHandlers.searchForAddressesByPostcode(request);
  });

  afterEach(() => sandbox.restore());

  test('calls the address search with the postcode', () => {
    const [postcode] = services.water.addressSearch.getAddressSearchResults.lastCall.args;
    expect(postcode).to.equal(POST_CODE);
  });

  test('returns the data from the address search and omits invalid address', () => {
    expect(result).to.equal([ ADDRESS1 ]);
  });

  test('returns a Boom not found error if a 404 is returned', async () => {
    const err = new Error();
    err.statusCode = 404;
    services.water.addressSearch.getAddressSearchResults
      .rejects(err);

    result = await preHandlers.searchForAddressesByPostcode(request);

    expect(result.isBoom).to.be.true();
    expect(result.message).to.equal(`No addresses found for postcode ${POST_CODE}`);
  });

  test('throws error if an unexpected error is returned', async () => {
    const error = new Error('oops');
    services.water.addressSearch.getAddressSearchResults
      .rejects(error);
    try {
      result = await preHandlers.searchForAddressesByPostcode(request);
    } catch (err) {
      expect(err).to.equal(error);
    }
  });
});
