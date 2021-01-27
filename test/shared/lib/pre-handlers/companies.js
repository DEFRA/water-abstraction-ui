'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const preHandlers = require('shared/lib/pre-handlers/companies');

const h = sandbox.stub();
const COMPANY_ID = 'test-company-id';

experiment('src/internal/modules/contact-entry/pre-handlers', () => {
  let request, result;
  beforeEach(async () => {
    request = {
      params: {
        companyId: COMPANY_ID
      },
      services: {
        water: {
          companies: {
            getCompany: sandbox.stub().resolves({ foo: 'bar' }),
            getContacts: sandbox.stub().resolves({ data: [{
              contact: {
                id: 'test-contact-id-1',
                firstName: 'George',
                lastName: 'Russel'
              }
            }, {
              contact: {
                id: 'test-contact-id-2',
                firstName: 'Lando',
                lastName: 'Norris'
              }
            }, {
              contact: {
                id: 'test-contact-id-1',
                firstName: 'George',
                lastName: 'Russel'
              }
            }
            ] })
          }
        }
      }
    };
  });

  afterEach(() => sandbox.restore());

  experiment('.loadCompany', () => {
    beforeEach(async () => {
      result = await preHandlers.loadCompany(request, h);
    });

    test('calls the water service with the company id from the request params', () => {
      expect(request.services.water.companies.getCompany.calledWith(
        COMPANY_ID
      )).to.be.true();
    });

    test('returns the result of the call to the water service', () => {
      expect(result).to.equal({ foo: 'bar' });
    });

    test('returns a Boom not found error if a 404 is thrown', async () => {
      const err = new Error('Uh oh');
      err.statusCode = 404;
      request.services.water.companies.getCompany.throws(err);
      result = await preHandlers.loadCompany(request, h);

      expect(result.isBoom).to.be.true();
      expect(result.message).to.equal(`Company not found for companyId: ${COMPANY_ID}`);
    });

    experiment('when a company id is explicitly provided', () => {
      test('calls the water service with the expected company id', async () => {
        await preHandlers.loadCompany(request, h, 'different-company-id');
        expect(request.services.water.companies.getCompany.calledWith(
          'different-company-id'
        )).to.be.true();
      });
    });
  });

  experiment('.loadCompanyContacts', () => {
    beforeEach(async () => {
      result = await preHandlers.loadCompanyContacts(request, h);
    });

    test('calls the water service with the company id from the request params', () => {
      expect(request.services.water.companies.getContacts.calledWith(
        COMPANY_ID
      )).to.be.true();
    });

    test('returns a list of unique contacts', () => {
      expect(result).to.equal([{
        id: 'test-contact-id-1',
        firstName: 'George',
        lastName: 'Russel'
      }, {
        id: 'test-contact-id-2',
        firstName: 'Lando',
        lastName: 'Norris'
      }]);
    });

    test('returns a Boom not found error if a 404 is thrown', async () => {
      const err = new Error('Uh oh');
      err.statusCode = 404;
      request.services.water.companies.getContacts.throws(err);
      result = await preHandlers.loadCompanyContacts(request, h);

      expect(result.isBoom).to.be.true();
      expect(result.message).to.equal(`Company contacts not found for companyId: ${COMPANY_ID}`);
    });

    experiment('when a company id is explicitly provided', () => {
      test('calls the water service with the expected company id', async () => {
        await preHandlers.loadCompanyContacts(request, h, 'different-company-id');
        expect(request.services.water.companies.getContacts.calledWith(
          'different-company-id'
        )).to.be.true();
      });
    });
  });
});
