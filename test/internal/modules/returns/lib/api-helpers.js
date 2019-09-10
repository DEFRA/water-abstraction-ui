'use strict';
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();

const {
  findLatestReturn,
  getRecentReturns,
  filterReturn
} = require('internal/modules/returns/lib/api-helpers');

const services = require('internal/lib/connectors/services');

experiment('findLatestReturn', () => {
  const result = findLatestReturn('12345678', 5);

  test('It should get a correct filter object', async () => {
    expect(result.filter).to.equal({
      licence_type: 'abstraction',
      regime: 'water',
      return_requirement: '12345678',
      'metadata->nald->regionCode': 5
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

  test('It should only select the required columns', async () => {
    expect(result.columns).to.equal(['return_id', 'status', 'licence_ref', 'return_requirement']);
  });
});

experiment('filterReturn', async () => {
  const retA = {
    return_id: 'v1:123'
  };
  const retB = {
    return_id: 'v1:456'
  };

  test('It should return the first return if present and no error', async () => {
    const result = filterReturn({
      error: null,
      data: [retA, retB]
    });
    expect(result).to.equal(retA);
  });

  test('It should return undefined if no return found', async () => {
    const result = filterReturn({
      error: null,
      data: []
    });
    expect(result).to.equal(undefined);
  });

  test('It should throw an error if an error was returned from the API', async () => {
    const func = () => {
      filterReturn({
        error: 'SomeError',
        data: null
      });
    };
    expect(func).to.throw();
  });
});

experiment('getRecentReturns', async () => {
  const returnData = {
    return_id: '123:456:789',
    licence_ref: '123/456/789',
    status: 'completed'
  };

  beforeEach(async () => {
    sandbox.stub(services.returns.returns, 'findMany').resolves({ data: [returnData] });
    sandbox.stub(services.returns.returns, 'findOne').resolves({ data: returnData });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('for a format ID, it should return an array of returns, 1 for each NALD region', async () => {
    const result = await getRecentReturns('123:456:789');
    expect(result[0]).to.equal(returnData);
  });

  test('For a return ID, it should return a single result', async () => {
    const result = await getRecentReturns('v1:2:MD/123/0045/067:12345678:2013-04-11:2014-03-31');
    expect(result.length).to.equal(1);
    expect(result[0]).to.equal(returnData);
  });
});
