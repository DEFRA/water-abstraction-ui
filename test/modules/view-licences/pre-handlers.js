const sinon = require('sinon');
const { experiment, test, afterEach, beforeEach } = exports.lab = require('lab').script();
const { expect } = require('code');

const preHandlers = require('../../../src/modules/view-licences/pre-handlers');
const CRM = require('../../../src/lib/connectors/crm');
const licenceConnector = require('../../../src/lib/connectors/water-service/licences');

const entityId = 'entity_1';
const documentId = 'document_1';
const companyId = 'company_1';

const request = {
  auth: {
    credentials: {
      entity_id: entityId,
      companyId
    }
  },
  params: {
    licence_id: documentId
  }
};

const responses = {
  found: {
    data: [{}],
    error: null
  },
  notFound: {
    data: [],
    error: null
  },
  error: {
    data: null,
    error: 'Some error'
  }
};

const h = { continue: 'continue' };

experiment('preAccessControl', () => {
  const sandbox = sinon.sandbox.create();

  beforeEach(async () => {
    sandbox.stub(CRM.documents, 'findMany');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('calls CRM with correct filter and continues with request', async () => {
    CRM.documents.findMany.resolves(responses.found);
    const response = await preHandlers.preAccessControl(request, h);

    const [filter] = CRM.documents.findMany.firstCall.args;
    expect(filter.company_entity_id).to.equal(companyId);
    expect(filter.document_id).to.equal(documentId);
    expect(response).to.equal(h.continue);
  });

  test('throws an error if error response', async () => {
    CRM.documents.findMany.resolves(responses.error);
    const func = () => (preHandlers.preAccessControl(request, h));
    expect(func()).to.reject();
  });

  test('throws Boom unauthorized error if no document found', async () => {
    CRM.documents.findMany.resolves(responses.notFound);
    return preHandlers.preAccessControl(request, h)
      .catch(err => {
        expect(err.isBoom).to.equal(true);
        expect(err.output.statusCode).to.equal(401);
      });
  });
});

experiment('preInternalView', () => {
  const sandbox = sinon.sandbox.create();

  beforeEach(async () => {
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
