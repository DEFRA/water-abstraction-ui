'use strict';
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const preHandlers = require('../../../../src/internal/modules/invoice-accounts/pre-handlers');
const uuid = require('uuid');
const sandbox = require('sinon').createSandbox();
const services = require('internal/lib/connectors/services');
const dataService = require('../../../../src/internal/modules/invoice-accounts/services/data-service');
const helpers = require('../../../../src/internal/modules/invoice-accounts/lib/helpers');
const { water } = require('../../../../src/internal/lib/connectors/services');

experiment('internal/modules/invoice-accounts/pre-handlers', () => {
  const regionId = uuid();
  const companyId = uuid();
  const licenceId = uuid();
  const addressId = uuid();
  const licenceNumber = '01/123';
  const tempAgentId = uuid();
  const filter = 'incorporated';
  const companyName = 'test company name';
  let request = {
    params: {
      regionId,
      companyId
    },
    query: {
      redirectPath: '/somewhere',
      licenceId,
      filter
    },
    view: {},
    yar: {
      get: sandbox.stub().returns({}),
      set: sandbox.stub(),
      clear: sandbox.stub()
    },
    pre: {
      company: {
        id: companyId,
        name: companyName
      }
    }
  };

  beforeEach(async () => {
    await sandbox.stub(dataService, 'sessionManager').returns({
      companyId,
      regionId,
      address: { id: addressId },
      agent: { id: tempAgentId },
      viewData: {
        redirectPath: '/somewhere',
        licenceNumber,
        licenceId,
        companyName
      }
    });
    await sandbox.stub(helpers, 'getAgentCompany').returns({ id: tempAgentId });

    sandbox.stub(services.water.companies, 'getCompany').resolves({
      companyId,
      name: companyName
    });
    sandbox.stub(services.water.companies, 'getCompaniesByName').resolves([{
      companyId,
      name: companyName
    }]);
  });
  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getCompany', async () => {
    test('calls the service method', async () => {
      await preHandlers.getCompany(request);
      expect(services.water.companies.getCompany.calledWith(companyId)).to.be.true();
    });
  });

  experiment('.loadCompanies', async () => {
    let response;
    beforeEach(async () => {
      response = await preHandlers.loadCompanies(request);
    });
    test('calls dataService.sessionManager with the correct params', async () => {
      const args = dataService.sessionManager.firstCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      // no data to merge is passed to the session
      expect(args[3]).to.equal(undefined);
      expect(dataService.sessionManager.calledOnce).to.be.true();
    });
    test('calls the helper to grab the agent company', async () => {
      expect(helpers.getAgentCompany.called).to.be.true();
    });
    test('returns an array', async () => {
      expect(Array.isArray(response)).to.be.true();
    });
  });

  experiment('.loadBillingContact', async () => {
    beforeEach(async () => {
      await preHandlers.loadBillingContact(request);
    });
    test('calls dataService.sessionManager with the correct params', async () => {
      const args = dataService.sessionManager.firstCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      // no data to merge is passed to the session
      expect(args[3]).to.equal(undefined);
      expect(dataService.sessionManager.calledOnce).to.be.true();
    });
  });

  experiment('.searchForCompaniesByString', async () => {
    beforeEach(async () => {
      await preHandlers.searchForCompaniesByString(request);
    });
    test('calls the service method', async () => {
      expect(water.companies.getCompaniesByName.calledWith(filter)).to.be.true();
    });
  });
});
