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

const licenceId = 'test-licence-id';
const licenceNumber = '01/123/ABC';

experiment('shared/lib/pre-handlers/licences', () => {
  let request, h;

  beforeEach(async () => {
    h = {};
    request = {
      params: {
        licenceId: 'test-licence-id'
      },
      query: {

      }
    };
    const licencesStub = {
      getLicenceById: sandbox.stub().resolves({ id: licenceId }),
      getDocumentByLicenceId: sandbox.stub().resolves({ document_id: 'test-document-id' }),
      getLicenceByLicenceNumber: sandbox.stub().resolves({ id: licenceId })
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

  experiment('.getLicenceByReturnId', () => {
    let result;
    const returnId = `v1:1:${licenceNumber}:1234:2020-04-01:2021:03-31`;
    beforeEach(async () => {
      request.params.returnId = returnId;
      result = await preHandlers.getLicenceByReturnId(request, h);
    });

    test('gets the licence for the return', () => {
      expect(
        request.services.water.licences.getLicenceByLicenceNumber.calledWith(licenceNumber)
      ).to.be.true();
    });

    test('returns the licence', () => {
      expect(result).to.equal({ id: licenceId });
    });

    experiment('when the licence is not found', () => {
      beforeEach(async () => {
        request.services.water.licences.getLicenceByLicenceNumber.throws(createError(404));
        result = await preHandlers.getLicenceByReturnId(request, h);
      });

      test('a Boom notFound error is returned', () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.payload.error).to.equal('Not Found');
        expect(result.message).to.equal(`Licence ${licenceNumber} for return ${returnId} not found`);
      });
    });

    experiment('unexpected errors are rethrown', () => {
      beforeEach(async () => {
        request.services.water.licences.getLicenceByLicenceNumber.throws(createError(500));
      });

      test('a Boom notFound error is returned', () => {
        const func = () => preHandlers.getLicenceByReturnId(request, h);
        expect(func()).to.reject();
      });
    });
  });
});
