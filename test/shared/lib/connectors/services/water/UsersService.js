const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const UsersService = require('shared/lib/connectors/services/water/UsersService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('services/water/UsersService', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves({});
    sandbox.stub(serviceRequest, 'post').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getUserStatus', () => {
    let service;

    beforeEach(async () => {
      service = new UsersService('http://127.0.0.1:8001/water/1.0');
      await service.getUserStatus('user-id');
    });

    test('passes the expected URL to the service request', async () => {
      const expectedUrl = `http://127.0.0.1:8001/water/1.0/user/user-id/status`;
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });
  });

  experiment('.postCreateInternalUser', () => {
    let service;

    beforeEach(async () => {
      service = new UsersService('http://127.0.0.1:8001/water/1.0');
      await service.postCreateInternalUser('user-id', 'newUser@email.gov.uk', 'permission');
    });

    test('passes the expected URL to the service request', async () => {
      const expectedUrl = `http://127.0.0.1:8001/water/1.0/user/internal`;
      const [url] = serviceRequest.post.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });

    test('passes the body data to the service request', async () => {
      const expectedOptions = {
        body: {
          callingUserId: 'user-id',
          newUserEmail: 'newUser@email.gov.uk',
          permissionsKey: 'permission'
        }
      };
      const [, options] = serviceRequest.post.lastCall.args;

      expect(options).to.equal(expectedOptions);
    });
  });
});
