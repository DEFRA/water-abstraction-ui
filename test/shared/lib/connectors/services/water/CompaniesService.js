const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { returns: { date: { createReturnCycles } } } = require('@envage/water-abstraction-helpers');
const { last } = require('lodash');

const CompaniesService = require('shared/lib/connectors/services/water/CompaniesService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('services/water/CompaniesService', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get');
    sandbox.stub(serviceRequest, 'post');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getCurrentDueReturns', () => {
    test('passes the expected URL to the service request', async () => {
      const service = new CompaniesService('http://127.0.0.1:8001/water/1.0');
      await service.getCurrentDueReturns('entity_1');
      const expectedUrl = `http://127.0.0.1:8001/water/1.0/company/entity_1/returns`;
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });

    test('passes the expected options to the service request', async () => {
      const service = new CompaniesService('http://127.0.0.1:8001/water/1.0');
      await service.getCurrentDueReturns('entity_1');

      const cycle = last(createReturnCycles());
      const [, { qs }] = serviceRequest.get.lastCall.args;

      expect(qs.status).to.equal('due');
      expect(qs.startDate).to.equal(cycle.startDate);
      expect(qs.endDate).to.equal(cycle.endDate);
      expect(qs.isSummer).to.equal(cycle.isSummer);
    });
  });

  experiment('.getContacts', () => {
    test('passes the expected URL to the service request', async () => {
      const service = new CompaniesService('http://127.0.0.1:8001/water/1.0');
      await service.getContacts('entity_1');
      const expectedUrl = `http://127.0.0.1:8001/water/1.0/companies/entity_1/contacts`;
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });
  });

  experiment('.getAddresses', () => {
    test('passes the expected URL to the service request', async () => {
      const service = new CompaniesService('http://127.0.0.1:8001/water/1.0');
      await service.getAddresses('entity_1');
      const expectedUrl = `http://127.0.0.1:8001/water/1.0/companies/entity_1/addresses`;
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });
  });

  experiment('.getCompany', () => {
    test('passes the expected URL to the service request', async () => {
      const service = new CompaniesService('http://127.0.0.1:8001/water/1.0');
      await service.getCompany('entity_1');
      const expectedUrl = `http://127.0.0.1:8001/water/1.0/companies/entity_1`;
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });
  });

  experiment('.postInvoiceAccount', () => {
    test('passes the expected URL to the service request', async () => {
      const service = new CompaniesService('http://127.0.0.1:8001/water/1.0');
      await service.postInvoiceAccount('entity_1');
      const expectedUrl = `http://127.0.0.1:8001/water/1.0/companies/entity_1/invoice-accounts`;
      const [url] = serviceRequest.post.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });

    test('passes the expected body object to the service request', async () => {
      const body = { address: { addressId: 'test-id' } };
      const service = new CompaniesService('http://127.0.0.1:8001/water/1.0');
      await service.postInvoiceAccount('entity_1', body);
      const args = serviceRequest.post.lastCall.args;
      expect(args[1]).to.equal({ body });
    });
  });
});
