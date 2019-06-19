const DocumentVerificationsApiClient = require('shared/lib/connectors/services/crm/DocumentVerificationsApiClient');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('lab').script();
const { expect } = require('code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

experiment('DocumentVerificationsApiClient', () => {
  let logger;
  let config;
  let client;

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves({});

    logger = {};
    config = {
      jwt: {
        token: 'test-jwt-token'
      },
      services: {
        crm: 'https://example.com/crm'
      }
    };

    client = new DocumentVerificationsApiClient(config, logger);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('construction', () => {
    test('creates the expected endpoint URL', async () => {
      expect(client.getUrl()).to.equal('https://example.com/crm/document_verifications');
    });

    test('sets the JWT in the client headers', async () => {
      expect(client.config.headers.Authorization).to.equal('test-jwt-token');
    });

    test('adds the base service URL to the config', async () => {
      expect(client.config.serviceUrl).to.equal('https://example.com/crm');
    });
  });

  experiment('.getDocumentVerifications', () => {
    test('passes the expected URL to the request', async () => {
      const expectedUrl = `https://example.com/crm/document_verifications`;
      await client.getDocumentVerifications('test-id');

      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });

    test('passes the expected filter query to the request', async () => {
      await client.getDocumentVerifications('test-id');

      const [, options] = serviceRequest.get.lastCall.args;
      const filter = JSON.parse(options.qs.filter);

      expect(filter).to.equal({
        document_id: 'test-id',
        'verification.date_verified': null
      });
    });
  });

  experiment('.getUniqueDocumentVerifications', () => {
    test('passes the expected URL to the request', async () => {
      const expectedUrl = `https://example.com/crm/document_verifications`;
      await client.getDocumentVerifications('test-id');

      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });

    test('passes the expected filter query to the request', async () => {
      await client.getDocumentVerifications('test-id');

      const [, options] = serviceRequest.get.lastCall.args;
      const filter = JSON.parse(options.qs.filter);

      expect(filter).to.equal({
        document_id: 'test-id',
        'verification.date_verified': null
      });
    });

    experiment('when no data is returned', () => {
      test('an empty array is returned', async () => {
        serviceRequest.get.resolves({
          error: null,
          data: []
        });

        const verifications = await client.getUniqueDocumentVerifications('test-id');
        expect(verifications).to.equal([]);
      });
    });

    experiment('when a single item is returned', () => {
      let verifications;

      beforeEach(async () => {
        serviceRequest.get.resolves({
          error: null,
          data: [{ entity_id: 'e-id', document_id: 'd-id' }]
        });

        verifications = await client.getUniqueDocumentVerifications('test-id');
      });

      test('the result is an array with one item', async () => {
        expect(verifications).to.have.length(1);
      });

      test('the item has a key', async () => {
        expect(verifications[0]).to.equal({
          document_id: 'd-id',
          entity_id: 'e-id',
          key: 'e-id.d-id'
        });
      });
    });

    experiment('duplicates are filtered out', () => {
      let verifications;

      beforeEach(async () => {
        serviceRequest.get.resolves({
          error: null,
          data: [
            { entity_id: 'e-1', document_id: 'd-1' },
            { entity_id: 'e-1', document_id: 'd-1' },
            { entity_id: 'e-2', document_id: 'd-2' }
          ]
        });

        verifications = await client.getUniqueDocumentVerifications('test-id');
      });

      test('the result is an array with two items', async () => {
        expect(verifications).to.have.length(2);
      });

      test('the expected items are present', async () => {
        expect(verifications.find(x => x.key === 'e-1.d-1')).to.exist();
        expect(verifications.find(x => x.key === 'e-2.d-2')).to.exist();
      });
    });

    test('results are sorted by date', async () => {
      serviceRequest.get.resolves({
        error: null,
        data: [
          {
            entity_id: 'e-1',
            document_id: 'd-1',
            date_created: '2018-01-10T10:00:00.000Z'
          },
          {
            entity_id: 'e-2',
            document_id: 'd-2',
            date_created: '2019-01-10T10:00:00.000Z'
          },
          {
            entity_id: 'e-3',
            document_id: 'd-3',
            date_created: '2017-01-10T10:00:00.000Z'
          }
        ]
      });

      const verifications = await client.getUniqueDocumentVerifications('test-id');

      expect(verifications[0].entity_id).to.equal('e-2');
      expect(verifications[1].entity_id).to.equal('e-1');
      expect(verifications[2].entity_id).to.equal('e-3');
    });
  });
});
