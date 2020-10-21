const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { serviceRequest } = require('@envage/water-abstraction-helpers');
const LicencesService = require('shared/lib/connectors/services/water/LicencesService');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const userResponses = require('../../../../responses/water-service/documents/_documentId_/licence/users');

experiment('services/water/LicencesService', () => {
  let service;

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves();
    sandbox.stub(serviceRequest, 'patch').resolves();
    sandbox.stub(serviceRequest, 'post').resolves();
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

  experiment('.getCompanyByDocumentId', () => {
    test('calls the expected URL without options', async () => {
      await service.getCompanyByDocumentId('doc-id');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/api/documents/doc-id/licence/company');
    });

    test('calls the expected URL with options', async () => {
      await service.getCompanyByDocumentId('doc-id', {
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

  experiment('.patchUnlinkLicence', () => {
    test('calls the expected URL', async () => {
      await service.patchUnlinkLicence('doc-id', 'user-id');
      const [url] = serviceRequest.patch.lastCall.args;
      expect(url).to.equal('https://example.com/api/documents/doc-id/unlink-licence');
    });

    test('calls with the expected options', async () => {
      await service.patchUnlinkLicence('doc-id', 'user-id');
      const [, options] = serviceRequest.patch.lastCall.args;
      expect(options).to.equal({
        body: {
          callingUserId: 'user-id'
        }
      });
    });
  });

  experiment('.getLicenceById', () => {
    test('makes a get request to the expected URL', async () => {
      await service.getLicenceById('licence-id');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/api/licences/licence-id');
    });
  });

  experiment('.getLicenceAgreements', () => {
    test('makes a get request to the expected URL', async () => {
      await service.getLicenceAgreements('licence-id');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/api/licences/licence-id/agreements');
    });
  });

  experiment('.getLicenceVersions', () => {
    test('makes a get request to the expected URL', async () => {
      await service.getLicenceVersions('licence-id');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/api/licences/licence-id/versions');
    });
  });

  experiment('.getLicenceAccountsByRefAndDate', () => {
    beforeEach(async () => {
      await service.getLicenceAccountsByRefAndDate('123/123', '2000-01-01');
    });

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/api/licences/licence-accounts');
    });

    test('passes the expected query params', async () => {
      const [, options] = serviceRequest.get.lastCall.args;
      expect(options.qs).to.equal({
        documentRef: '123/123',
        date: '2000-01-01'
      });
    });
  });

  experiment('.getDocumentByLicenceId', () => {
    test('makes a get request to the expected URL', async () => {
      await service.getDocumentByLicenceId('licence-id');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/api/licences/licence-id/document');
    });
  });

  experiment('.createAgreement', () => {
    test('makes a get request to the expected URL', async () => {
      await service.createAgreement('licence-id', { some: 'data' });
      const [url] = serviceRequest.post.lastCall.args;
      expect(url).to.equal('https://example.com/api/licences/licence-id/agreements');
    });
  });

  experiment('.getValidDocumentByLicenceIdAndDate', () => {
    test('makes a get request to the expected URL', async () => {
      await service.getValidDocumentByLicenceIdAndDate('licence-id', '2019-04-01');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/api/licences/licence-id/valid-documents/2019-04-01');
    });
  });
});
