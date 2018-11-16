'use strict';
const sinon = require('sinon');
const { expect } = require('code');
const Lab = require('lab');
const { experiment, test, before, after } = exports.lab = Lab.script();

const {
  findLatestReturn,
  getRecentReturnByFormatId
} = require('../../../../src/modules/returns/lib/api-helpers');

const returnsService = require('../../../../src/lib/connectors/returns');
const helpers = require('../../../../src/modules/returns/lib/helpers');

experiment('findLatestReturn', () => {
  const result = findLatestReturn('12345678');

  test('It should get a correct filter object', async () => {
    expect(result.filter).to.equal({
      licence_type: 'abstraction',
      regime: 'water',
      return_requirement: '12345678'
    });
  });

  test('It should get a correct sort object', async () => {
    expect(result.sort).to.equal({
      end_date: -1
    });
  });

  test('It should get a correct pagination object', async () => {
    expect(result.pagination).to.equal({
      page: 1,
      perPage: 1
    });
  });

  test('It should only select the return ID column', async () => {
    expect(result.columns).to.equal(['return_id', 'status', 'licence_ref']);
  });
});

experiment('getRecentReturnByFormatId', () => {
  let returnsStub;

  const returnData = {
    return_id: '123:456:789',
    licence_ref: '123/456/789',
    status: 'completed'
  };

  before(async () => {
    returnsStub = sinon.stub(returnsService.returns, 'findMany').resolves({ data: [returnData]});
  });

  after(async () => {
    returnsStub.restore();
  });

  test('It should not return anything if CRM document header not found', async () => {
    const crmHeaderStub = sinon.stub(helpers, 'getLicenceNumbers').resolves([]);
    const result = await getRecentReturnByFormatId('123:456:789');
    expect(result).to.equal(undefined);
    crmHeaderStub.restore();
  });

  test('It should return return data if CRM document header is found', async () => {
    const crmHeaderStub = sinon.stub(helpers, 'getLicenceNumbers').resolves([{}]);
    const result = await getRecentReturnByFormatId('123:456:789');
    expect(result).to.equal(returnData);
    crmHeaderStub.restore();
  });
});
