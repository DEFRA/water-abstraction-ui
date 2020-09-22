'use strict';
const { expect } = require('@hapi/code');
const { experiment, test, before, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const preHandlers = require('../../../../src/internal/modules/invoice-accounts/pre-handlers');
const uuid = require('uuid');
const sandbox = require('sinon').createSandbox();
const services = require('internal/lib/connectors/services');
const dataService = require('../../../../src/internal/modules/invoice-accounts/services/data-service');

experiment('internal/modules/invoice-accounts/pre-handlers', () => {
  const regionId = uuid();
  const companyId = uuid();
  const licenceId = uuid();
  const addressId = uuid();
  const licenceNumber = '01/123';
  const tempAgentId = uuid();
  const companyName = 'test company name';
  let request = {
    params: {
      regionId,
      companyId
    },
    query: {
      redirectPath: '/somewhere',
      licenceId
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
    await sandbox.stub(dataService, 'sessionManager').resolves({
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

    sandbox.stub(services.water.companies, 'getCompany').resolves({
      companyId,
      name: companyName
    });
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
});
