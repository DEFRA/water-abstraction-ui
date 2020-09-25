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

let defaultId = uuid();
let contactId = uuid();
let companyId = uuid();
let regionId = uuid();

const createRequest = (tempSessionKey, contactType = 'organisation', expectedSelectedCompanyId = '123456') => {
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
        id: defaultId,
        back: 'someplace',
        sessionKey: tempSessionKey,
        originalCompanyId: companyId,
        regionId: regionId,
        searchQuery: 'testco',
        accountType: contactType,
        selectedCompaniesHouseNumber: expectedSelectedCompanyId,
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
    request = createRequest(uuid(), 'organisation', '123456');

    sandbox.stub(services.water.companies, 'getCompaniesFromCompaniesHouse').resolves({
      data: [
        {
          company: {
            companyAddresses: [
              { address: {} }
            ]
          }
        }
      ]
    });

    sandbox.stub(services.water.companies, 'getAddresses').resolves([]);

    sandbox.stub(services.water.companies, 'getCompaniesByName').resolves([
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
    experiment('when selectedCompaniesHouseNumber is valid', () => {
      beforeEach(async () => {
        response = await preHandlers.returnCompanyAddressesFromCompaniesHouse(request);
      });
      afterEach(async () => {
        sandbox.restore();
      });
      test('calls yar.get', async () => {
        expect(request.yar.get.called).to.be.true();
      });

      test('returns an array', () => {
        expect(Array.isArray(response)).to.be.true();
      });

      test('calls the service method', async () => {
        expect(services.water.companies.getCompaniesFromCompaniesHouse.calledWith('123456')).to.be.true();
      });
    });

    experiment('when selectedCompaniesHouseNumber is invalid', () => {
      let responseToUnhealthyRequest, unhealthyRequest;

      beforeEach(async () => {
        unhealthyRequest = createRequest(uuid(), 'organisation', undefined);
        responseToUnhealthyRequest = await preHandlers.returnCompanyAddressesFromCompaniesHouse(unhealthyRequest);
      });

      afterEach(async () => {
        sandbox.restore();
      });
      test('calls yar.get', async () => {
        expect(unhealthyRequest.yar.get.called).to.be.true();
      });
      test('returns an array', () => {
        expect(Array.isArray(responseToUnhealthyRequest)).to.be.true();
      });
    });
  });
});
