const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const DocumentsService = require('shared/lib/connectors/services/water/DocumentsService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('services/water/CompaniesService', () => {
  const body = { name: 'doc-name', user: 'user-name', rename: true };
  const docId = 'test-doc-id';
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'post');
    const service = new DocumentsService('http://127.0.0.1:8001/water/1.0');
    await service.postLicenceRename(docId, body);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.setLicenceName', () => {
    test('passes the expected URL to the service request', async () => {
      const expectedUrl = `http://127.0.0.1:8001/water/1.0/documents/test-doc-id/rename`;
      const [url] = serviceRequest.post.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });

    test('passes the expected arguments to updateOne', async () => {
      const args = serviceRequest.post.lastCall.args;
      expect(args[1].body).to.equal(body);
    });
  });
});
