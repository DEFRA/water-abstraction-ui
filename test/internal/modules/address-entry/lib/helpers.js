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

const addressEntryHelpers = require('internal/modules/address-entry/lib/helpers');

const sessionData = { redirectPath: '/redirect/path', back: '/back' };

const addressSearchResults = [
  { address: 'first-address' },
  { address: 'second-address' }
];

const createRequest = (options = {}) => ({
  view: {
    foo: 'bar'
  },
  yar: {
    get: sandbox.stub().returns({ ...sessionData, addressSearchResults })
  },
  pre: { addressSearchResults },
  ...options
});

experiment('internal/modules/address-entry/lib/helpers', () => {
  let request;
  beforeEach(() => {
    sandbox.stub(services.water.licences, 'getLicenceById').resolves({ licenceNumber: '12/34/56' });
    sandbox.stub(sessionHelpers, 'getRedirectPathAndClearSession').returns('/redirect/path');
    sandbox.stub(sessionHelpers, 'saveToSession');
  });

  afterEach(() => sandbox.restore());

  experiment('.getRedirectPath', () => {
    test('calls the session helpers with the correct params', () => {
      request = createRequest();
      addressEntryHelpers.getRedirectPath(request);
      const [requestObject, sessionKey] = sessionHelpers.getRedirectPathAndClearSession.lastCall.args;
      expect(requestObject).to.equal(request);
      expect(sessionKey).to.equal(addressEntryHelpers.SESSION_KEY);
    });
  });

  experiment('.getPostcodeUrl', () => {
    test('returns the expected url using data saved in the session', () => {
      const query = queryString.stringify(sessionData);
      const url = addressEntryHelpers.getPostcodeUrl(createRequest());
      expect(url).to.equal(`/address-entry/postcode?${query}`);
    });
  });

  experiment('.saveReferenceData', () => {
    const request = createRequest({ query: {
      licenceId: 'test-licence-id',
      redirectPath: '/redirect/path',
      back: '/back'
    } });

    test('saves the reference data in the session', async () => {
      await addressEntryHelpers.saveReferenceData(request);
      const [requestObject, sessionKey, data] = sessionHelpers.saveToSession.lastCall.args;
      expect(requestObject).to.equal(request);
      expect(sessionKey).to.equal(addressEntryHelpers.SESSION_KEY);
      expect(data).to.equal({
        redirectPath: '/redirect/path',
        back: '/back',
        licenceNumber: '12/34/56'
      });
    });

    test('does not include the licence number if it is null', async () => {
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
