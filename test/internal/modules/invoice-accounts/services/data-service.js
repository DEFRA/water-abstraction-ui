'use-strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const dataService = require('internal/modules/invoice-accounts/services/data-service');
const services = require('internal/lib/connectors/services');
const sessionHelpers = require('shared/lib/session-helpers');

const uuid = require('uuid');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

experiment('internal/modules/invoice-accounts/lib/data-service', () => {
  let request;
  const regionId = uuid();
  const companyId = uuid();
  const addressId = uuid();

  const company = {
    id: companyId,
    name: 'The Water Drinker',
    type: 'person'
  };

  const address = {
    id: addressId,
    addressLine1: 'Rock Farm Partnership',
    addressLine2: 'The Studios',
    addressLine3: 'Courtyards',
    addressLine4: null,
    town: 'Rawkyall',
    county: 'Rawkshire',
    postcode: 'RA1 1WK',
    country: 'England',
    uprn: null
  };

  const licence = { id: 'test-licence-id', licenceNumber: '01/118' };
  const invoiceAcc = {
    id: uuid(),
    accountNumber: 'A12345678A'
  };

  beforeEach(async () => {
    request = {
      yar: {
        get: sandbox.stub(),
        set: sandbox.stub()
      }
    };
    sandbox.stub(services.water.companies, 'getCompany').resolves(company);
    sandbox.stub(services.water.licences, 'getLicenceById').resolves(licence);
    sandbox.stub(services.water.companies, 'postInvoiceAccount').resolves(invoiceAcc);
    sandbox.stub(sessionHelpers, 'saveToSession').returns(address);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.sessionManager', () => {
    test('saves the session data using the session helpers', () => {
      const expectedSessionKey = `newInvoiceAccountFlow.${regionId}.${companyId}`;
      dataService.sessionManager(request, regionId, companyId, licence);
      const [requestObject, sessionKey, data] = sessionHelpers.saveToSession.lastCall.args;
      expect(requestObject).to.equal(request);
      expect(sessionKey).to.equal(expectedSessionKey);
      expect(data).to.equal(licence);
    });

    test('returns the return value from the session helpers', () => {
      const result = dataService.sessionManager(request, regionId, companyId);
      expect(result).to.equal(address);
    });
  });

  experiment('.getCompany', () => {
    test('returns the correct company object', async () => {
      const result = await dataService.getCompany(companyId);
      expect(result).to.equal(company);
    });

    test('calls the companies service with the correct id', async () => {
      await dataService.getCompany(companyId);
      const [entityId] = services.water.companies.getCompany.lastCall.args;
      expect(entityId).to.equal(companyId);
    });
  });

  experiment('.getCompanyAddresses', () => {
    beforeEach(async () => {
      sandbox.stub(services.water.companies, 'getAddresses').resolves([{ address }, { address }]);
    });

    test('calls the companies service with the correct entity id', async () => {
      await dataService.getCompanyAddresses(companyId);
      const [entityId] = services.water.companies.getAddresses.lastCall.args;
      expect(entityId).to.equal(companyId);
    });

    test('returns a unique list of addresses when duplicate addresses are reveived from the companies service', async () => {
      const result = await dataService.getCompanyAddresses(companyId);
      expect(result).to.equal([address]);
    });

    test('returns a unique list of addresses when multiple addresses are reveived from the companies service', async () => {
      const addresses = [{ address }, { address }, { address: { ...address, id: uuid() } }];
      services.water.companies.getAddresses.resolves(addresses);
      const result = await dataService.getCompanyAddresses(companyId);
      expect(result).to.equal([addresses[0].address, addresses[2].address]);
    });
  });

  experiment('.getLicenceById', () => {
    test('calls the licence service with the correct id', async () => {
      await dataService.getLicenceById('test-id');
      const [entityId] = services.water.licences.getLicenceById.lastCall.args;
      expect(entityId).to.equal('test-id');
    });
    test('returns the licence object', async () => {
      const result = await dataService.getLicenceById('test-id');
      expect(result).to.equal(licence);
    });
  });

  experiment('.saveInvoiceAccDetails', () => {
    test('calls the companies service with the correct args', async () => {
      const data = { test: 'data' };
      await dataService.saveInvoiceAccDetails(companyId, data);
      const args = services.water.companies.postInvoiceAccount.lastCall.args;
      expect(args[0]).to.equal(companyId);
      expect(args[1]).to.equal({ test: 'data' });
    });
    test('calls the companies service with the correct args', async () => {
      const data = { companyId: 'test-id', test: 'data' };
      const result = await dataService.saveInvoiceAccDetails(data);
      expect(result).to.equal(invoiceAcc);
    });
  });
});
