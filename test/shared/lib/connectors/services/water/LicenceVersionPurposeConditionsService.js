const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { serviceRequest } = require('@envage/water-abstraction-helpers');
const LicenceVersionPurposeConditionsService = require('shared/lib/connectors/services/water/LicenceVersionPurposeConditionsService');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

experiment('services/water/LicenceVersionPurposeConditionsService', () => {
  let service;

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves();
    service = new LicenceVersionPurposeConditionsService('https://example.com/api');
  });

  afterEach(async () => sandbox.restore());

  experiment('.getLicenceVersionPurposeConditionById', () => {
    test('calls the expected URL', async () => {
      await service.getLicenceVersionPurposeConditionById('lvpc-id');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/api/licence-version-purpose-conditions/lvpc-id');
    });
  });

  experiment('.getLicenceVersionPurposeConditionsByLicenceId', () => {
    test('calls the expected URL', async () => {
      await service.getLicenceVersionPurposeConditionsByLicenceId('licence-id');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/api/licences/licence-id/licence-version-purpose-conditions');
    });
  });
});
