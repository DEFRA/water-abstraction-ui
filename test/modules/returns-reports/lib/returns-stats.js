'use strict';
const sinon = require('sinon');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const { expect } = require('code');

const { returns } = require('../../../../src/lib/connectors/returns');
const { getKeyAndValue, isGrouped, isSingleValue, mapReportResponse, getReturnStats } = require('../../../../src/modules/returns-reports/lib/returns-stats');

const data = {
  singleValue: [{
    count: 123
  }],
  aggregateData: [{
    return_frequency: 'day',
    count: 123
  }, {
    return_frequency: 'month',
    count: 456
  }],
  otherData: [{
    return_id: 'v1:123'
  }, {
    return_id: 'v1:456'
  }]
};

lab.experiment('getKeyAndValue helpers', () => {
  lab.test('It should get the key and value of an aggregate data row', async () => {
    const result = getKeyAndValue(data.aggregateData[0]);
    expect(result).to.equal({ key: 'day', value: 123 });
  });
});

lab.experiment('isGrouped', () => {
  lab.test('Returns true if data appears to be from an aggregate query with a count column', async () => {
    expect(isGrouped(data.aggregateData)).to.equal(true);
  });

  lab.test('Returns false for other data', async () => {
    expect(isGrouped(data.otherData)).to.equal(false);
  });
});

lab.experiment('isSingleValue', () => {
  lab.test('Returns true if data is a single value in a "count" column', async () => {
    expect(isSingleValue(data.singleValue)).to.equal(true);
  });

  lab.test('Returns false for other data', async () => {
    expect(isSingleValue(data.otherData)).to.equal(false);
  });
});

lab.experiment('mapReportResponse', () => {
  lab.test('Throws an error if error returned from API', async () => {
    const func = () => {
      return mapReportResponse({ error: 'Oops!' });
    };
    expect(func).to.throw();
  });

  lab.test('Returns a single value if detected', async () => {
    const response = { data: data.singleValue, error: null };
    expect(mapReportResponse(response)).to.equal(123);
  });

  lab.test('Returns aggregate data if detected', async () => {
    const response = { data: data.aggregateData, error: null };
    expect(mapReportResponse(response)).to.equal({
      day: 123,
      month: 456
    });
  });

  lab.test('Passes through other data without mapping', async () => {
    const response = { data: data.otherData, error: null };
    expect(mapReportResponse(response)).to.equal(data.otherData);
  });
});

lab.experiment('getReturnStats', () => {
  let stub;

  lab.beforeEach(async () => {
    stub = sinon.stub(returns, 'getReport').resolves({
      error: null,
      data: data.otherData
    });
  });

  lab.afterEach(async () => {
    stub.restore();
  });

  lab.test('It should get all stats reports for the specified cycle end date', async () => {
    const result = await getReturnStats('2018-10-31');

    expect(result.statuses).to.equal(data.otherData);
    expect(result.licenceCount).to.equal(data.otherData);
    expect(result.frequencies).to.equal(data.otherData);
  });
});
