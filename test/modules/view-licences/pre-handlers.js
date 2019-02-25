const sinon = require('sinon');
const { set } = require('lodash');
const { experiment, test, afterEach, beforeEach } = exports.lab = require('lab').script();
const { expect } = require('code');

const preHandlers = require('../../../src/modules/view-licences/pre-handlers');
const CRM = require('../../../src/lib/connectors/crm');
const licenceConnector = require('../../../src/lib/connectors/water-service/licences');
const { scope } = require('../../../src/lib/constants');

const documentId = 'document_1';
const companyId = 'company_1';

const createRequest = () => {
  return {
    auth: {
      credentials: {
      }
    },
    params: {
      documentId
    }
  };
};

const createInternalRequest = () => {
  const request = createRequest();
  set(request, 'auth.credentials.scope', [scope.internal]);
  return request;
};
const createExternalRequest = () => {
  const request = createRequest();
  set(request, 'auth.credentials.scope', [scope.external, scope.licenceHolder]);
  set(request, 'auth.credentials.companyId', companyId);
  return request;
};

const responses = {
  found: {
    data: [{ company_entity_id: companyId }],
    error: null
  },
  notFound: {
    data: [],
    error: null
  },
  wrongCompany: {
    data: [{ company_entity_id: 'not_my_company' }],
    error: null
  },
  error: {
    data: null,
    error: 'Some error'
  }
};

const h = { continue: 'continue' };

experiment('preLoadDocument', () => {
  const sandbox = sinon.sandbox.create();

  beforeEach(async () => {
    sandbox.stub(CRM.documents, 'findMany');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('for internal users', () => {
    let request;

    beforeEach(async () => {
      request = createInternalRequest();
      CRM.documents.findMany.resolves(responses.found);
    });

    test('calls CRM with correct document filter', async () => {
      await preHandlers.preLoadDocument(request, h);
      const [filter] = CRM.documents.findMany.firstCall.args;
      expect(filter).to.equal({ document_id: documentId });
    });

    test('if document found, responds with h.continue', async () => {
      const response = await preHandlers.preLoadDocument(request, h);
      expect(response).to.equal(h.continue);
    });

    test('if document not found, throw not found error', async () => {
      CRM.documents.findMany.resolves(responses.notFound);

      try {
        await preHandlers.preLoadDocument(request, h);
      } catch (error) {
        expect(error.isBoom).to.equal(true);
        expect(error.output.statusCode).to.equal(404);
      }
    });

    test('if CRM error, throw error', async () => {
      CRM.documents.findMany.resolves(responses.error);
      const func = () => preHandlers.preLoadDocument(request, h);
      expect(func()).to.reject();
    });
  });

  experiment('for external users', () => {
    let request;

    beforeEach(async () => {
      request = createExternalRequest();
      CRM.documents.findMany.resolves(responses.found);
    });

    test('calls CRM with correct document filter', async () => {
      await preHandlers.preLoadDocument(request, h);
      const [filter] = CRM.documents.findMany.firstCall.args;
      expect(filter).to.equal({ document_id: documentId });
    });

    test('if document found, responds with h.continue', async () => {
      const response = await preHandlers.preLoadDocument(request, h);
      expect(response).to.equal(h.continue);
    });

    test('if document not found, throw not found error', async () => {
      CRM.documents.findMany.resolves(responses.notFound);

      try {
        await preHandlers.preLoadDocument(request, h);
      } catch (error) {
        expect(error.isBoom).to.equal(true);
        expect(error.output.statusCode).to.equal(404);
      }
    });

    test('if document had wrong company, throws 401 error', async () => {
      CRM.documents.findMany.resolves(responses.wrongCompany);

      try {
        await preHandlers.preLoadDocument(request, h);
      } catch (error) {
        expect(error.isBoom).to.equal(true);
        expect(error.output.statusCode).to.equal(401);
      }
    });

    test('if CRM error, throw error', async () => {
      CRM.documents.findMany.resolves(responses.error);
      const func = () => preHandlers.preLoadDocument(request, h);
      expect(func()).to.reject();
    });
  });
});

experiment('preInternalView', () => {
  const sandbox = sinon.sandbox.create();
  let request;

  beforeEach(async () => {
    request = createInternalRequest();
    sandbox.stub(CRM, 'getDocumentVerifications');
    sandbox.stub(licenceConnector, 'getLicencePrimaryUserByDocumentId');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('it should call the CRM getDocumentVerifications connector with correct arguments', async () => {
    await preHandlers.preInternalView(request, h);
    const { args } = CRM.getDocumentVerifications.firstCall;
    expect(args).to.equal([documentId]);
  });

  test('it should call the getLicencePrimaryUserByDocumentId connector with correct arguments', async () => {
    await preHandlers.preInternalView(request, h);
    const { args } = licenceConnector.getLicencePrimaryUserByDocumentId.firstCall;
    expect(args).to.equal([documentId]);
  });

  test('it should set the correct data in the view', async () => {
    const verifications = { foo: 'bar' };
    const primary = { bar: 'foo' };
    CRM.getDocumentVerifications.resolves(verifications);
    licenceConnector.getLicencePrimaryUserByDocumentId.resolves(primary);

    await preHandlers.preInternalView(request, h);

    expect(request.view.verifications).to.equal(verifications);
    expect(request.view.primaryUser).to.equal(primary);
  });
});
