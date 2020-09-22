const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const AgreementsService = require('internal/lib/connectors/services/water/AgreementsService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('services/water/AgreementsService', () => {
  let service;

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get');
    sandbox.stub(serviceRequest, 'delete');
    service = new AgreementsService('http://127.0.0.1:8001/water/1.0');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getAgreement', () => {
    beforeEach(async () => {
      await service.getAgreement('test-agreement-id');
    });

    test('passes the expected URL to the service request', async () => {
      const expectedUrl = 'http://127.0.0.1:8001/water/1.0/agreements/test-agreement-id';
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });
  });

  experiment('.deleteAgreement', () => {
    beforeEach(async () => {
      await service.deleteAgreement('test-agreement-id');
    });

    test('passes the expected URL to the service request', async () => {
      const expectedUrl = 'http://127.0.0.1:8001/water/1.0/agreements/test-agreement-id';
      const [url] = serviceRequest.delete.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });
  });
});
