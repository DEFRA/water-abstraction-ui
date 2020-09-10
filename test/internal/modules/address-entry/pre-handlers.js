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

const POSTCODE = 'TT1 1TT';

experiment('src/internal/modules/address-entry/pre-handlers .searchForAddressesByPostcode', () => {
  let request, result;
  beforeEach(async () => {
    sandbox.stub(services.water.addressSearch, 'getAddressSearchResults')
      .resolves({ data: { foo: 'bar' } });

    request = {
      query: {
        postcode: POSTCODE
      }
    };
    result = await preHandlers.searchForAddressesByPostcode(request);
  });

  afterEach(() => sandbox.restore());

  test('calls the address search with the postcode', () => {
    const [postcode] = services.water.addressSearch.getAddressSearchResults.lastCall.args;
    expect(postcode).to.equal(POSTCODE);
  });

  test('can handle getting the postcode from the payload', async () => {
    request = {
      payload: {
        postcode: POSTCODE
      }
    };
    result = await preHandlers.searchForAddressesByPostcode(request);
    const [postcode] = services.water.addressSearch.getAddressSearchResults.lastCall.args;
    expect(postcode).to.equal(POSTCODE);
  });

  test('returns the data from the address search', () => {
    expect(result).to.equal({ foo: 'bar' });
  });

  test('returns a Boom not found error if a 404 is returned', async () => {
    const err = new Error();
    err.statusCode = 404;
    services.water.addressSearch.getAddressSearchResults
      .rejects(err);

    result = await preHandlers.searchForAddressesByPostcode(request);

    expect(result.isBoom).to.be.true();
    expect(result.message).to.equal(`No addresses found for postcode ${POSTCODE}`);
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
