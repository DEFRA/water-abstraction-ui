'use strict';

const { experiment, test, afterEach, beforeEach } = exports.lab = require('lab').script();
const { expect } = require('code');
const sandbox = require('sinon').createSandbox();
const LicenceDataConfig = require('../../../src/external/lib/LicenceDataConfig');

const documentId = 'document_1';
const request = {
  defra: {
    companyId: 'company_1'
  }
};

experiment('LicenceDataConfig', () => {
  let licenceData, connectors;

  beforeEach(async () => {
    connectors = {
      water: {
        licences: {
          getSummaryByDocumentId: sandbox.stub().resolves({ error: null }),
          getCommunicationsByDocumentId: sandbox.stub().resolves({ error: null })
        }
      }
    };
    licenceData = new LicenceDataConfig(null, connectors);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getSummaryByDocumentId', () => {
    test('calls getSummaryByDocumentId on water service', async () => {
      await licenceData.getSummaryByDocumentId(documentId, request);

      const { args } = connectors.water.licences.getSummaryByDocumentId.lastCall;

      expect(args[0]).to.equal(documentId);
      expect(args[1]).to.equal({ companyId: request.defra.companyId });
    });

    test('throws an error if an API error response is returned', async () => {
      connectors.water.licences.getSummaryByDocumentId.resolves({ error: 'oh no!' });
      const func = () => licenceData.getSummaryByDocumentId(documentId, request);
      expect(func()).to.reject();
    });
  });

  experiment('getCommunicationsByDocumentId', () => {
    test('calls getSummaryByDocumentId on water service', async () => {
      await licenceData.getCommunicationsByDocumentId(documentId, request);

      const { args } = connectors.water.licences.getCommunicationsByDocumentId.lastCall;

      expect(args[0]).to.equal(documentId);
      expect(args[1]).to.equal({ companyId: request.defra.companyId });
    });

    test('throws an error if an API error response is returned', async () => {
      connectors.water.licences.getCommunicationsByDocumentId.resolves({ error: 'oh no!' });
      const func = () => licenceData.getCommunicationsByDocumentId(documentId, request);
      expect(func()).to.reject();
    });
  });
});
