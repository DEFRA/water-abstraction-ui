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
const preHandlers = require('internal/modules/account-entry/pre-handlers');
const session = require('internal/modules/account-entry/lib/session');

const KEY = 'test-key';

const data = {
  getCompaniesFromCompaniesHouseResponse: {
    data: {
      company: {
        companyAddresses: [
          { address: {} }
        ]
      }
    }
  },
  companies: [{
    companyAddresses: [],
    companyContacts: [],
    name: 'Mr Test Testerson',
    type: 'person',
    id: uuid()
  }]
};

experiment('internal/modules/contact-entry/pre-handlers', () => {
  let request, response;

  beforeEach(async () => {
    request = {
      query: {
        q: 'Test query'
      },
      params: {
        key: KEY
      }
    };

    sandbox.stub(services.water.companies, 'getCompaniesFromCompaniesHouse').resolves(data.getCompaniesFromCompaniesHouseResponse);
    sandbox.stub(services.water.companies, 'getCompaniesByName').resolves(data.companies);

    sandbox.stub(session, 'get');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('searchForCompaniesInCompaniesHouse', () => {
    experiment('when the query is an empty string', () => {
      beforeEach(async () => {
        request.query.q = '';
        response = await preHandlers.searchForCompaniesInCompaniesHouse(request);
      });

      test('the service method is not called', async () => {
        expect(services.water.companies.getCompaniesFromCompaniesHouse.called).to.be.false();
      });

      test('resolves with an empty array', async () => {
        expect(response).to.be.an.array().length(0);
      });
    });

    experiment('when the query is valid', () => {
      beforeEach(async () => {
        response = await preHandlers.searchForCompaniesInCompaniesHouse(request);
      });

      test('the service method is called', async () => {
        expect(services.water.companies.getCompaniesFromCompaniesHouse.calledWith(
          request.query.q
        )).to.be.true();
      });

      test('resolves with the company data', async () => {
        expect(response).to.equal(data.getCompaniesFromCompaniesHouseResponse.data);
      });
    });
  });

  experiment('.getSessionData', () => {
    experiment('when an object is set in the session', () => {
      beforeEach(async () => {
        session.get.returns({
          foo: 'bar'
        });
        response = preHandlers.getSessionData(request);
      });

      test('calls session.get with correct params', async () => {
        expect(session.get.calledWith(request, KEY)).to.be.true();
      });

      test('returns the data', async () => {
        expect(response).to.equal({ foo: 'bar' });
      });
    });

    experiment('when an object is not set in the session', () => {
      beforeEach(async () => {
        session.get.returns(undefined);
        response = preHandlers.getSessionData(request);
      });

      test('returns a Boom 404', async () => {
        expect(response.isBoom).to.equal(true);
        expect(response.output.statusCode).to.equal(404);
      });
    });
  });

  experiment('.searchCRMCompanies', () => {
    beforeEach(async () => {
      response = await preHandlers.searchCRMCompanies(request);
    });

    test('the service method is called with the query string', async () => {
      expect(services.water.companies.getCompaniesByName.calledWith(
        request.query.q
      )).to.be.true();
    });

    test('resolves with the companies from the API call', async () => {
      expect(response).to.equal(data.companies);
    });
  });
});
