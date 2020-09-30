'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');

const uuid = require('uuid/v4');

const sandbox = sinon.createSandbox();

const controller = require('../../../../src/internal/modules/contact-entry/controllers');
const ADDRESS_FLOW_SESSION_KEY = require('../../../../src/internal/modules/address-entry/plugin').SESSION_KEY;

let contactId = uuid();
let companyId = uuid();
let regionId = uuid();
let back = '/some/return/url';

const createRequest = (tempSessionKey, contactType = 'organisation') => {
  return ({
    query: {
      sessionKey: tempSessionKey,
      back: back
    },
    params: {
      regionId: regionId,
      companyId: companyId
    },
    view: {
      foo: 'bar',
      csrfToken: uuid()
    },
    pre: {
      companiesHouseResults: [{
        company: {
          companyNumber: '123456',
          name: 'some company name'
        }
      }],
      companiesHouseAddresses: [{
        'postal_code': 'GL10 1GL',
        'locality': 'Cheltenham',
        'address_line_2': 'Some place',
        'country': 'England'
      }],
      addressSearchResults: [],
      contactSearchResults: [{
        id: contactId,
        name: 'some name'
      }]
    },
    yar: {
      get: sandbox.stub().resolves({
        back: back,
        sessionKey: tempSessionKey,
        originalCompanyId: companyId,
        regionId: regionId,
        searchQuery: 'testco',
        accountType: contactType
      }),
      set: sandbox.stub(),
      clear: sandbox.stub()
    },
    server: {
      methods: {
        setDraftChargeInformation: sandbox.stub()
      }
    }
  });
};

experiment('internal/modules/contact-entry/controllers', () => {
  let request, h;

  beforeEach(async () => {
    h = {
      view: sandbox.stub(),
      postRedirectGet: sandbox.stub(),
      redirect: sandbox.stub()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getNew', () => {
    let tempSessionKey;

    beforeEach(async () => {
      request = createRequest(uuid());
      await controller.getNew(request, h);
      tempSessionKey = uuid();
    });
    test('the client is redirected to the account type page', async () => {
      expect(h.redirect.lastCall.args[0]).to.equal(
        `/contact-entry/new/account-type?sessionKey=${tempSessionKey}`
      );
    });
  });
});
