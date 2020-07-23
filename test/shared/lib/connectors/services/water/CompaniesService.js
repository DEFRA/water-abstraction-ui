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

  // getContacts (entityId) {
  //   const url = this.joinUrl('companies', entityId, 'contacts');
  //   return this.serviceRequest.get(url);
  // }

  // getAddresses (entityId) {
  //   const url = this.joinUrl('companies', entityId, 'addresses');
  //   return this.serviceRequest.get(url);
  // }

  // getCompany (entityId) {
  //   const url = this.joinUrl('companies', entityId);
  //   return this.serviceRequest.get(url);
  // }

  // postInvoiceAccount (invoiceAccount) {
  //   const url = this.joinUrl('companies', invoiceAccount.companyId, 'invoice-accounts');
  //   return this.serviceRequest.post(url);
  // }
});
