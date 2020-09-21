'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const uuid = require('uuid/v4');

const services = require('internal/lib/connectors/services');
const preHandlers = require('internal/modules/contact-entry/pre-handlers');

let contactId = uuid();
let companyId = uuid();
let regionId = uuid();

const createRequest = (tempSessionKey, contactType = 'organisation') => {
  return ({
    query: {
      sessionKey: tempSessionKey,
      back: '/some/return/url'
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
        id: uuid(),
        back: 'someplace',
        sessionKey: tempSessionKey,
        originalCompanyId: companyId,
        regionId: regionId,
        searchQuery: 'testco',
        accountType: contactType,
        selectedCompaniesHouseNumber: '123456',
        companyNameOrNumber: 'SomeCompany'
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

experiment('internal/modules/contact-entry/pre-handlers', () => {
  let request, response;

  beforeEach(async () => {
    request = createRequest(uuid());
    services.water.companies.getCompaniesByName = sandbox.stub();

    services.water.companies.getCompaniesByName.resolves([
      {
        id: uuid(),
        name: 'Company One'
      }
    ]);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('searchForCompaniesByString', () => {
    beforeEach(async () => {
      response = await preHandlers.searchForCompaniesByString({ ...request, payload: { searchQuery: 'search term' } });
    });

    afterEach(async () => {
      sandbox.restore();
    });

    test('responds with an array', async () => {
      expect(Array.isArray(response)).to.be.true();
    });

    test('calls the service method', async () => {
      expect(
        services.water.companies.getCompaniesByName.calledWith('search term')
      ).to.be.true();
    });
  });

  experiment('searchForCompaniesInCompaniesHouse', () => {
    beforeEach(async () => {
      response = await preHandlers.searchForCompaniesInCompaniesHouse(request);
    });

    afterEach(async () => {
      sandbox.restore();
    });

    test('calls yar.get', async () => {
      expect(request.yar.get.called).to.be.true();
    });

    test('responds with an array', async () => {
      expect(Array.isArray(response)).to.be.true();
    });
  });

  experiment('returnCompanyAddressesFromCompaniesHouse', () => {
    beforeEach(async () => {
      response = await preHandlers.returnCompanyAddressesFromCompaniesHouse(request);
    });

    afterEach(async () => {
      sandbox.restore();
    });

    test('calls yar.get', async () => {
      expect(request.yar.get.called).to.be.true();
    });

    test('responds with an array', async () => {
      expect(Array.isArray(response)).to.be.true();
    });
  });
});
