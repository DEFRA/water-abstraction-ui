const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const sinon = require('sinon');
const returns = require('../../../../src/lib/connectors/water-service/returns');
const files = require('../../../../src/lib/files');
const serviceRequest = require('../../../../src/lib/connectors/service-request');

const sandbox = sinon.createSandbox();

experiment('returns', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'post');
    sandbox.stub(files, 'readFile').returns('fileData');
  });
  afterEach(async () => {
    sandbox.restore();
  });

  experiment('postXML', () => {
    test('calls  serviceRequest.post with url, fileData and userName', async () => {
      await returns.postXML('file', 'bob.jones@gmail.com');
      const [url, options] = serviceRequest.post.lastCall.args;
      expect(url).to.contain(['/returns/upload-xml']);
      expect(options.body).to.include({ fileData: 'fileData', userName: 'bob.jones@gmail.com' });
    });
  });
});
