const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const { expect } = require('code');

const { serviceRequest } = require('@envage/water-abstraction-helpers');
const LicencesService = require('shared/lib/connectors/services/water/LicencesService');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const userResponses = require('../../../../responses/water-service/documents/_documentId_/licence/users');

experiment('services/water/LicencesService', () => {
  let service;

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves();
    service = new LicencesService('https://example.com/api');
  });

  afterEach(async () => sandbox.restore());

  experiment('.getSummaryByDocumentId', () => {
    test('calls the expected URL without options', async () => {
      await service.getSummaryByDocumentId('doc-id');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/api/documents/doc-id/licence/summary');
    });

    test('calls the expected URL with options', async () => {
      await service.getSummaryByDocumentId('doc-id', {
        companyId: '00000000-0000-0000-0000-000000000000',
        includeExpired: true
      });
      const [, query] = serviceRequest.get.lastCall.args;
      expect(query).to.equal({
        qs: {
          companyId: '00000000-0000-0000-0000-000000000000',
          includeExpired: true
        }
      });
    });
  });

  experiment('.getCommunicationsByDocumentId', () => {
    test('calls the expected URL without options', async () => {
      await service.getCommunicationsByDocumentId('doc-id');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/api/documents/doc-id/licence/communications');
    });

    test('calls the expected URL with options', async () => {
      await service.getCommunicationsByDocumentId('doc-id', {
        companyId: '00000000-0000-0000-0000-000000000000',
        includeExpired: true
      });
      const [, query] = serviceRequest.get.lastCall.args;
      expect(query).to.equal({
        qs: {
          companyId: '00000000-0000-0000-0000-000000000000',
          includeExpired: true
        }
      });
    });
  });

  experiment('.getByDocumentId', () => {
    test('calls the expected URL without options', async () => {
      await service.getByDocumentId('doc-id');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/api/documents/doc-id/licence');
    });

    test('calls the expected URL with options', async () => {
      await service.getByDocumentId('doc-id', {
        includeExpired: true
      });
      const [, query] = serviceRequest.get.lastCall.args;
      expect(query).to.equal({
        qs: {
          includeExpired: true
        }
      });
    });
  });

  experiment('.getConditionsByDocumentId', () => {
    test('calls the expected URL without options', async () => {
      await service.getConditionsByDocumentId('doc-id');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/api/documents/doc-id/licence/conditions');
    });
  });

  experiment('.getPointsByDocumentId', () => {
    test('calls the expected URL without options', async () => {
      await service.getPointsByDocumentId('doc-id');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/api/documents/doc-id/licence/points');
    });
  });

  experiment('.getUsersByDocumentId', () => {
    test('calls the expected URL without options', async () => {
      await service.getUsersByDocumentId('doc-id');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/api/documents/doc-id/licence/users');
    });

    test('calls the expected URL with options', async () => {
      await service.getUsersByDocumentId('doc-id', {
        includeExpired: true
      });
      const [, query] = serviceRequest.get.lastCall.args;
      expect(query).to.equal({
        qs: {
          includeExpired: true
        }
      });
    });
  });

  experiment('.getPrimaryUserByDocumentId', () => {
    beforeEach(async () => {
      serviceRequest.get.resolves(userResponses.multipleUsersIncludingPrimaryUser());
    });

    test('calls the expected URL without options', async () => {
      await service.getPrimaryUserByDocumentId('doc-id');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/api/documents/doc-id/licence/users');
    });

    test('calls the expected URL with options', async () => {
      await service.getPrimaryUserByDocumentId('doc-id', {
        includeExpired: true
      });
      const [, query] = serviceRequest.get.lastCall.args;
      expect(query).to.equal({
        qs: {
          includeExpired: true
        }
      });
    });

    test('returns undefined when there is not primary user', async () => {
      serviceRequest.get.resolves(userResponses.multipleUsersExcludingPrimaryUser());
      const { data: user } = await service.getPrimaryUserByDocumentId('test-id');

      expect(user).to.be.undefined();
    });

    test('returns the expected user when there is a primary user', async () => {
      const { data } = await service.getPrimaryUserByDocumentId('test-id');

      expect(data).to.be.equal({
        userId: 4444,
        entityId: '44444444-0000-0000-0000-000000000000',
        userName: 'test4@example.com',
        roles: ['primary_user']
      });
    });
  });
});
