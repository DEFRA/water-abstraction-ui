const { expect } = require('code');
const sinon = require('sinon');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();

const { getLicenceReturns } = require('../../../../src/modules/view-licences/lib/licence-returns');
const returns = require('../../../../src/lib/connectors/returns');

experiment('getLicenceReturns', () => {
  beforeEach(async () => {
    sinon.stub(returns.returns, 'findMany').resolves({ error: null, data: [] });
  });

  afterEach(async () => {
    returns.returns.findMany.restore();
  });

  test('it should call the returns api with the correct arguments for external user', async () => {
    await getLicenceReturns('01/123', false);
    const [filter, sort, pagination] = returns.returns.findMany.firstCall.args;

    expect(filter.licence_ref).to.equal('01/123');
    expect(filter.status).to.equal({ $ne: 'void' });

    expect(sort).to.equal({ end_date: -1 });

    expect(pagination.page).to.equal(1);
    expect(pagination.perPage).to.equal(10);
  });

  test('it should return data from the API', async () => {
    const result = await getLicenceReturns('01/123', false);
    expect(result.data).to.be.an.array();
    expect(result.error).to.equal(null);
  });

  test('it should display void returns to internal users', async () => {
    await getLicenceReturns('01/123', true);
    const [filter] = returns.returns.findMany.firstCall.args;

    expect(filter.licence_ref).to.equal('01/123');
    expect(filter.status).to.be.undefined();
  });

  test('it should throw an error if the API returns an error', async () => {
    returns.returns.findMany.resolves({
      error: 'Some error'
    });
    const func = () => getLicenceReturns('01/123');
    expect(func()).to.reject();
  });
});
