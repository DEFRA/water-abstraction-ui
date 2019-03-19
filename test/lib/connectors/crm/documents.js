const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();

const documents = require('../../../../src/lib/connectors/crm/documents.js');
const companyId = 'company_1';

const responses = {
  ok: {
    pagination: {
      totalRows: 15
    }
  },
  error: {
    error: 'oh no'
  }
};

experiment('getLicenceCount', () => {
  beforeEach(async () => {
    sandbox.stub(documents, 'findMany').resolves(responses.ok);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the expected filter to the documents API', async () => {
    await documents.getLicenceCount(companyId);
    const [filter, , pagination] = documents.findMany.lastCall.args;

    expect(filter).to.equal({ company_entity_id: companyId });
    expect(pagination).to.equal({ page: 1, perPage: 1 });
  });

  test('resolves with the total number of rows', async () => {
    const result = await documents.getLicenceCount(companyId);
    expect(result).to.equal(15);
  });

  test('rejects if the API returns an error response', async () => {
    documents.findMany.resolves(responses.error);
    const func = () => documents.getLicenceCount(companyId);
    expect(func()).to.reject(); ;
  });
});
