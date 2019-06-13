const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const { expect } = require('code');
const sandbox = require('sinon').createSandbox();
const serviceRequest = require('../../../../../../src/shared/lib/connectors/service-request');
const UsersAPIClient = require('../../../../../../src/shared/lib/connectors/services/idm/UsersAPIClient');
const rp = sandbox.stub();
const client = new UsersAPIClient(rp, {
  endpoint: 'http://test-endpoint'
});

experiment('Shared UsersAPIClient', () => {
  const userId = 'user_1';
  const application = 'test_app';
  const password = 'top-secret';
  const userName = 'bob@example.com';
  const userResponse = {
    body: {
      user_name: 'bob@example.com'
    }
  };
  const entityId = 'entity_1';

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'post').resolves(userResponse);
    sandbox.stub(client, 'findMany').resolves({ error: null,
      data: [{
        user_name: 'bob@example.com'
      }] });
    sandbox.stub(client, 'updateOne').resolves({ error: null,
      data: [{
        user_name: 'bob@example.com'
      }] });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('authenticate', () => {
    experiment('when IDM post resolves', () => {
      test('calls IDM /login with correct params', async () => {
        await client.authenticate(userName, password, application);
        const [uri, options] = serviceRequest.post.lastCall.args;
        expect(uri).to.equal('http://test-endpoint/login');
        expect(options).to.equal({
          body: {
            user_name: userName,
            password,
            application
          }
        });
      });

      test('resolves with IDM response', async () => {
        const result = await client.authenticate(userName, password, application);
        expect(result).to.equal(userResponse);
      });
    });

    test('when IDM throws 401 error, resolves undefined', async () => {
      const err = new Error();
      err.statusCode = 401;
      serviceRequest.post.rejects(err);
      const result = await client.authenticate(userName, password, application);
      expect(result).to.be.undefined();
    });

    test('rejects for non-401 errors', async () => {
      const err = new Error();
      serviceRequest.post.rejects(err);
      const func = () => client.authenticate(userName, password, application);
      expect(func()).to.reject();
    });
  });

  experiment('findOneByEmail', () => {
    test('calls client.findMany with correct filter', async () => {
      await client.findOneByEmail(userName, application);
      expect(client.findMany.calledWith({
        user_name: userName,
        application
      })).to.equal(true);
    });

    test('resolves with user found in API call', async () => {
      const result = await client.findOneByEmail(userName, application);
      expect(result).to.equal({
        user_name: userName
      });
    });

    test('throws error if error API response', async () => {
      client.findMany.resolves({ error: 'oh no!' });
      const func = () => client.findOneByEmail(userName, application);
      expect(func()).to.reject();
    });
  });

  experiment('updateExternalId', () => {
    test('calls client.updateOne if external ID is truthy', async () => {
      await client.updateExternalId({ user_id: userId }, entityId);
      expect(client.updateOne.calledWith(userId, {
        external_id: entityId
      })).to.equal(true);
    });

    test('does not call client.updateOne if external ID is already set', async () => {
      await client.updateExternalId({ user_id: userId, externalId: entityId }, entityId);
      expect(client.updateOne.callCount).to.equal(1);
    });
  });
});
