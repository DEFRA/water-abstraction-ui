'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const sessionHelpers = require('shared/lib/session-helpers');
const services = require('internal/lib/connectors/services');
const queryString = require('querystring');
const { omit } = require('lodash');

const addressEntryHelpers = require('internal/modules/address-entry/lib/helpers');

const sessionData = { redirectPath: '/redirect/path', back: '/back' };

const addressSearchResults = [
  { address: 'first-address' },
  { address: 'second-address' }
];

const newAddress = {
  address2: '123',
  address3: 'Test Place',
  town: 'Testington',
  postcode: 'TT1 1TT',
  country: 'United Kingdom',
  uprn: 123456
};

const createRequest = (options = {}) => ({
  view: {
    foo: 'bar'
  },
  yar: {
    get: sandbox.stub().returns(sessionData),
    clear: sandbox.stub()
  },
  pre: { addressSearchResults },
  getNewAddress: sandbox.stub().returns(newAddress),
  ...options
});

experiment('internal/modules/address-entry/lib/helpers', () => {
  let request;
  beforeEach(() => {
    request = createRequest();
    sandbox.stub(services.water.licences, 'getLicenceById').resolves({ licenceNumber: '12/34/56' });
    sandbox.stub(sessionHelpers, 'saveToSession');
  });

  afterEach(() => sandbox.restore());

  experiment('.getRedirectPath', () => {
    test('returns the redirect path stored in the session', () => {
      const result = addressEntryHelpers.getRedirectPath(request);
      expect(result).to.equal(sessionData.redirectPath);
    });
  });

  experiment('.getAddressUprn', () => {
    let result;
    beforeEach(() => {
      result = addressEntryHelpers.getAddressUprn(request);
    });

    test('calls the getNewAddress function on the request object', () => {
      const [clearDataFlag] = request.getNewAddress.lastCall.args;
      expect(clearDataFlag).to.equal(false);
    });

    test('returns the uprn if it is present', () => {
      expect(result).to.equal(newAddress.uprn);
    });

    test('returns null if uprn is not present', () => {
      request.getNewAddress.returns(omit(newAddress, 'uprn'));
      result = addressEntryHelpers.getAddressUprn(request);
      expect(result).to.equal(null);
    });
  });

  experiment('.getPageCaption', () => {
    test('does not return a caption if licenceNumber is not in session', () => {
      const caption = addressEntryHelpers.getPageCaption(request);
      expect(caption).to.be.undefined();
    });

    test('returns the expected string using data saved in the session', () => {
      request.yar.get.returns({ ...sessionData, licenceNumber: '12/34/ABC' });
      const caption = addressEntryHelpers.getPageCaption(request);
      expect(caption).to.equal({ caption: 'Licence 12/34/ABC' });
    });
  });

  experiment('.getPostcodeUrlParams', () => {
    test('returns the expected data from the session', () => {
      const data = addressEntryHelpers.getPostcodeUrlParams(request);
      expect(data).to.equal({
        redirectPath: '/redirect/path',
        back: '/back'
      });
    });

    test('includes the licenceId if is present', () => {
      request.yar.get.returns({ ...sessionData, licenceId: 'test-licence-id' });
      const data = addressEntryHelpers.getPostcodeUrlParams(request);
      expect(data).to.equal({
        redirectPath: '/redirect/path',
        back: '/back',
        licenceId: 'test-licence-id'
      });
    });
  });

  experiment('.getPostcodeUrl', () => {
    test('returns the expected url using data saved in the session', () => {
      const query = queryString.stringify(sessionData);
      const url = addressEntryHelpers.getPostcodeUrl(request);
      expect(url).to.equal(`/address-entry/postcode?${query}`);
    });
  });

  experiment('.saveReferenceData', () => {
    beforeEach(async () => {
      request = createRequest({ query: {
        licenceId: 'test-licence-id',
        redirectPath: '/redirect/path',
        back: '/back'
      } });

      await addressEntryHelpers.saveReferenceData(request);
    });

    test('clears the session', async () => {
      const [sessionKey] = request.yar.clear.lastCall.args;
      expect(sessionKey).to.equal(addressEntryHelpers.SESSION_KEY);
    });

    test('saves the reference data in the session', async () => {
      const [requestObject, sessionKey, data] = sessionHelpers.saveToSession.lastCall.args;
      expect(requestObject).to.equal(request);
      expect(sessionKey).to.equal(addressEntryHelpers.SESSION_KEY);
      expect(data).to.equal({
        redirectPath: '/redirect/path',
        back: '/back',
        licenceId: 'test-licence-id',
        licenceNumber: '12/34/56'
      });
    });

    test('does not include the licence data if licence id is not provided', async () => {
      delete request.query.licenceId;
      await addressEntryHelpers.saveReferenceData(request);
      const [requestObject, sessionKey, data] = sessionHelpers.saveToSession.lastCall.args;
      expect(requestObject).to.equal(request);
      expect(sessionKey).to.equal(addressEntryHelpers.SESSION_KEY);
      expect(data).to.equal({
        redirectPath: '/redirect/path',
        back: '/back'
      });
    });
  });
});
