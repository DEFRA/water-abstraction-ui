const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const ChangeEmailAddressService = require('external/lib/connectors/services/water/ChangeEmailAddressService');

experiment('external/ChangeEmailAddressService', () => {
  let logger;
  let config;
  let service;

  const userId = 123;

  beforeEach(async () => {
    logger = {
      error: sandbox.spy()
    };
    config = {
      services: {
        water: 'https://example.com/water'
      }
    };
    service = new ChangeEmailAddressService(config.services.water, logger);

    sandbox.stub(service.serviceRequest, 'get').resolves({});
    sandbox.stub(service.serviceRequest, 'post').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('postGenerateSecurityCode', () => {
    beforeEach(async () => {
      await service.postGenerateSecurityCode(userId, 'new@example.com');
    });

    test('calls the correct URL', async () => {
      const [url] = service.serviceRequest.post.lastCall.args;
      expect(url).to.equal(`https://example.com/water/user/${userId}/change-email-address`);
    });

    test('supplies the new email address in the post body', async () => {
      const [, options] = service.serviceRequest.post.lastCall.args;
      expect(options.body.email).to.equal('new@example.com');
    });
  });

  experiment('postSecurityCode', () => {
    beforeEach(async () => {
      await service.postSecurityCode(userId, '123456');
    });

    test('calls the correct URL', async () => {
      const [url] = service.serviceRequest.post.lastCall.args;
      expect(url).to.equal(`https://example.com/water/user/${userId}/change-email-address/code`);
    });

    test('supplies the new email address in the post body', async () => {
      const [, options] = service.serviceRequest.post.lastCall.args;
      expect(options.body.securityCode).to.equal('123456');
    });
  });

  experiment('getStatus', () => {
    beforeEach(async () => {
      await service.getStatus(userId, '123456');
    });

    test('calls the correct URL', async () => {
      const [url] = service.serviceRequest.get.lastCall.args;
      expect(url).to.equal(`https://example.com/water/user/${userId}/change-email-address`);
    });
  });
});
