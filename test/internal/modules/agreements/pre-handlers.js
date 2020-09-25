'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const services = require('internal/lib/connectors/services');
const preHandlers = require('internal/modules/agreements/pre-handlers');

const createError = code => {
  const error = new Error('oops');
  error.statusCode = code;
  return error;
};

experiment('internal/modules/agreements/pre-handlers', () => {
  beforeEach(() => {
    sandbox.stub(services.water.agreements, 'getAgreement').resolves({
      id: 'test-agreement-id',
      agreement: {
        code: 'S127'
      }
    });
    sandbox.stub(services.water.licences, 'getLicenceById').resolves({ id: 'test-licence-id' });
    sandbox.stub(services.crm.documents, 'getWaterLicence').resolves({ document_id: 'test-document-id' });
  });

  afterEach(() => sandbox.restore());

  experiment('.loadAgreement', () => {
    let request, result;
    beforeEach(async () => {
      request = {
        params: {
          agreementId: 'test-agreement-id'
        }
      };

      result = await preHandlers.loadAgreement(request);
    });

    test('gets the agreement', () => {
      const [id] = services.water.agreements.getAgreement.lastCall.args;
      expect(id).to.equal('test-agreement-id');
    });

    test('returns the agreement with the expected description', () => {
      expect(result).to.equal({
        id: 'test-agreement-id',
        agreement: {
          code: 'S127',
          description: 'Two-part tariff (S127)'
        }
      });
    });

    experiment('when the agreement is not found', () => {
      beforeEach(async () => {
        services.water.agreements.getAgreement.throws(createError(404));
        result = await preHandlers.loadAgreement(request);
      });

      test('a Boom notFound error is returned', () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.payload.error).to.equal('Not Found');
        expect(result.message).to.equal('Agreement test-agreement-id not found');
      });
    });

    experiment('when an unexpected error is thrown', () => {
      beforeEach(() => {
        services.water.agreements.getAgreement.throws(createError(500));
      });

      test('the error is thrown', async () => {
        try {
          await preHandlers.loadAgreement(request);
        } catch (err) {
          expect(err.message).to.equal('oops');
          expect(err.statusCode).to.equal(500);
        }
      });
    });
  });

  experiment('.loadLicence', () => {
    let request, result;
    beforeEach(async () => {
      request = {
        params: {
          licenceId: 'test-licence-id'
        }
      };

      result = await preHandlers.loadLicence(request);
    });

    test('gets the licence', () => {
      const [id] = services.water.licences.getLicenceById.lastCall.args;
      expect(id).to.equal('test-licence-id');
    });

    test('returns the licence', () => {
      expect(result).to.equal({ id: 'test-licence-id' });
    });

    experiment('when the licence is not found', () => {
      beforeEach(async () => {
        services.water.licences.getLicenceById.throws(createError(404));
        result = await preHandlers.loadLicence(request);
      });

      test('a Boom notFound error is returned', () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.payload.error).to.equal('Not Found');
        expect(result.message).to.equal('Licence test-licence-id not found');
      });
    });
  });

  experiment('.loadDocument', () => {
    let request, result;
    beforeEach(async () => {
      request = {
        params: {
          licenceId: 'test-licence-id'
        }
      };

      services.water.licences.getLicenceById.resolves({ licenceNumber: '123/456/78' });

      result = await preHandlers.loadDocument(request);
    });

    test('gets the licence number', () => {
      const [id] = services.water.licences.getLicenceById.lastCall.args;
      expect(id).to.equal('test-licence-id');
    });

    test('gets the document using the licence number', () => {
      const [licenceNumber] = services.crm.documents.getWaterLicence.lastCall.args;
      expect(licenceNumber).to.equal('123/456/78');
    });

    test('returns the document', () => {
      expect(result).to.equal({ document_id: 'test-document-id' });
    });

    experiment('when the document is not found', () => {
      beforeEach(async () => {
        services.crm.documents.getWaterLicence.throws(createError(404));
        result = await preHandlers.loadDocument(request);
      });

      test('a Boom notFound error is returned', () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.payload.error).to.equal('Not Found');
        expect(result.message).to.equal('Document for licence 123/456/78 not found in CRM');
      });
    });
  });
});
