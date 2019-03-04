const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const sinon = require('sinon');
const returns = require('../../../../src/lib/connectors/water-service/returns');
const serviceRequest = require('../../../../src/lib/connectors/service-request');

const sandbox = sinon.createSandbox();

experiment('returns', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'post');
  });
  afterEach(async () => {
    sandbox.restore();
  });

  experiment('postXML', () => {
    test('calls  serviceRequest.post with url, fileData and userName', async () => {
      await returns.postXML('fileData', 'bob.jones@gmail.com');
      const [url, options] = serviceRequest.post.lastCall.args;
      expect(url).to.contain(['/returns/upload-xml']);
      expect(options.body).to.include({ fileData: 'fileData', userName: 'bob.jones@gmail.com' });
    });
  });
});
