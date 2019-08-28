'use strict';

const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const services = require('external/lib/connectors/services');
const licenceDataConfig = require('external/lib/licence-data-config');
const sandbox = require('sinon').createSandbox();

experiment('external LicenceDataConfig', () => {
  let request;

  beforeEach(async () => {
    sandbox.stub(services.water.licences, 'getSummaryByDocumentId').resolves();
    request = {
      defra: {
        companyId: 'company_1'
      }
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('calls the specified API method on the water service', async () => {
    await licenceDataConfig.getLicenceData('getSummaryByDocumentId', 'licence_1', request);
    expect(services.water.licences.getSummaryByDocumentId.callCount).to.equal(1);
  });

  test('calls the water method with the document ID and company ID for the external application', async () => {
    await licenceDataConfig.getLicenceData('getSummaryByDocumentId', 'licence_1', request);

    const [documentId, options] = services.water.licences.getSummaryByDocumentId.lastCall.args;
    expect(documentId).to.equal('licence_1');
    expect(options).to.equal({ companyId: 'company_1' });
  });
});
