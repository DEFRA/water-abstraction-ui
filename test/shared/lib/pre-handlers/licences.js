'use strict';

const { set } = require('lodash');
const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const preHandlers = require('shared/lib/pre-handlers/licences');

const createError = code => {
  const error = new Error('oops');
  error.statusCode = code;
  return error;
};

experiment('shared/lib/pre-handlers/licences', () => {
  let request, h;

  beforeEach(async () => {
    h = {};
    request = {
      params: {
        licenceId: 'test-licence-id'
      }
    };
    const licencesStub = {
      getLicenceById: sandbox.stub().resolves({ id: 'test-licence-id' }),
      getDocumentByLicenceId: sandbox.stub().resolves({ document_id: 'test-document-id' })
    };

    set(request, 'services.water.licences', licencesStub);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.loadLicence', () => {
    let result;
    beforeEach(async () => {
      result = await preHandlers.loadLicence(request, h);
    });

    test('gets the licence', () => {
      const [id] = request.services.water.licences.getLicenceById.lastCall.args;
      expect(id).to.equal('test-licence-id');
    });

    test('returns the licence', () => {
      expect(result).to.equal({ id: 'test-licence-id' });
    });

    experiment('when the licence is not found', () => {
      beforeEach(async () => {
        request.services.water.licences.getLicenceById.throws(createError(404));
        result = await preHandlers.loadLicence(request, h);
      });

      test('a Boom notFound error is returned', () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.payload.error).to.equal('Not Found');
        expect(result.message).to.equal('Licence test-licence-id not found');
      });
    });

    experiment('unexpected errors are rethrown', () => {
      beforeEach(async () => {
        request.services.water.licences.getLicenceById.throws(createError(500));
      });

      test('a Boom notFound error is returned', () => {
        const func = () => preHandlers.loadLicence(request, h);
        expect(func()).to.reject();
      });
    });
  });

  experiment('.loadLicenceDocument', () => {
    let result;
    beforeEach(async () => {
      result = await preHandlers.loadLicenceDocument(request, h);
    });

    test('gets the licence document', () => {
      const [id] = request.services.water.licences.getDocumentByLicenceId.lastCall.args;
      expect(id).to.equal('test-licence-id');
    });

    test('returns the document', () => {
      expect(result).to.equal({ document_id: 'test-document-id' });
    });

    experiment('when the licence is not found', () => {
      beforeEach(async () => {
        request.services.water.licences.getDocumentByLicenceId.throws(createError(404));
        result = await preHandlers.loadLicenceDocument(request, h);
      });

      test('a Boom notFound error is returned', () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.payload.error).to.equal('Not Found');
        expect(result.message).to.equal('CRM document for licence test-licence-id not found');
      });
    });

    experiment('unexpected errors are rethrown', () => {
      beforeEach(async () => {
        request.services.water.licences.getLicenceById.throws(createError(500));
      });

      test('a Boom notFound error is returned', () => {
        const func = () => preHandlers.loadLicence(request, h);
        expect(func()).to.reject();
      });
    });
  });
});
