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

const services = require('internal/lib/connectors/services');
const preHandlers = require('internal/modules/account-entry/pre-handlers');

const data = {
  getCompaniesFromCompaniesHouseResponse: {
    data: {
      company: {
        companyAddresses: [
          { address: {} }
        ]
      }
    }
  }
};

experiment('internal/modules/contact-entry/pre-handlers', () => {
  let request, response;

  beforeEach(async () => {
    request = {
      query: {
        q: 'Test query'
      }
    };

    sandbox.stub(services.water.companies, 'getCompaniesFromCompaniesHouse').resolves(data.getCompaniesFromCompaniesHouseResponse);
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
});
