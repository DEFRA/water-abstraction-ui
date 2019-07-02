'use strict';
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();

const { expect } = require('code');

const services = require('internal/lib/connectors/services');
const { getKeyAndValue, isGrouped, isSingleValue, mapReportResponse, getReturnStats } = require('internal/modules/returns-reports/lib/returns-stats');

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

experiment('getKeyAndValue helpers', () => {
  test('It should get the key and value of an aggregate data row', async () => {
    const result = getKeyAndValue(data.aggregateData[0]);
    expect(result).to.equal({ key: 'day', value: 123 });
  });
});

experiment('isGrouped', () => {
  test('Returns true if data appears to be from an aggregate query with a count column', async () => {
    expect(isGrouped(data.aggregateData)).to.equal(true);
  });

  test('Returns false for other data', async () => {
    expect(isGrouped(data.otherData)).to.equal(false);
  });
});

experiment('isSingleValue', () => {
  test('Returns true if data is a single value in a "count" column', async () => {
    expect(isSingleValue(data.singleValue)).to.equal(true);
  });

  test('Returns false for other data', async () => {
    expect(isSingleValue(data.otherData)).to.equal(false);
  });
});

experiment('mapReportResponse', () => {
  test('Throws an error if error returned from API', async () => {
    const func = () => {
      return mapReportResponse({ error: 'Oops!' });
    };
    expect(func).to.throw();
  });

  test('Returns a single value if detected', async () => {
    const response = { data: data.singleValue, error: null };
    expect(mapReportResponse(response)).to.equal(123);
  });

  test('Returns aggregate data if detected', async () => {
    const response = { data: data.aggregateData, error: null };
    expect(mapReportResponse(response)).to.equal({
      day: 123,
      month: 456
    });
  });

  test('Passes through other data without mapping', async () => {
    const response = { data: data.otherData, error: null };
    expect(mapReportResponse(response)).to.equal(data.otherData);
  });
});

experiment('getReturnStats', () => {
  beforeEach(async () => {
    sandbox.stub(services.returns.returns, 'getReport').resolves({
      error: null,
      data: data.otherData
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('It should get all stats reports for the specified cycle end date', async () => {
    const result = await getReturnStats('2018-10-31');

    expect(result.statuses).to.equal(data.otherData);
    expect(result.licenceCount).to.equal(data.otherData);
    expect(result.frequencies).to.equal(data.otherData);
  });
});
