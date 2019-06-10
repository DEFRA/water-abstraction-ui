'use strict';
const Lab = require('lab');
const sinon = require('sinon');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const mappers = require('internal/modules/service-status/lib/mappers');
const { expect } = require('code');

const kpiData = require('./kpi-data.json');

experiment('mapCRMKPI', () => {
  test('It should map array data to an object', async () => {
    const result = mappers.mapCRMKPI(kpiData.crm);
    expect(result).to.be.equal({
      point_1: '9',
      point_2: '4'
    });
  });

  test('It should return an empty object if the input is not an object', async () => {
    const result = mappers.mapCRMKPI('ERROR');
    expect(result).to.equal({});
  });
});

experiment('mapIDMKPI', () => {
  test('It should map array data to an object', async () => {
    const result = mappers.mapIDMKPI(kpiData.idm);
    expect(result).to.be.equal({
      point_1: '10',
      point_2: '1'
    });
  });

  test('It should return an empty object if the input is not an object', async () => {
    const result = mappers.mapIDMKPI('ERROR');
    expect(result).to.equal({});
  });
});

experiment('mapToJSON', () => {
  const sandbox = sinon.sandbox.create();

  const data = [
    1,
    kpiData.idm,
    2,
    kpiData.crm,
    3,
    4,
    5,
    6,
    'OK'
  ];

  beforeEach(async () => {
    sandbox.stub(mappers, 'mapIDMKPI').returns({
      idm_1: '1',
      idm_2: '2'
    });
    sandbox.stub(mappers, 'mapCRMKPI').returns({
      idm_1: '1',
      idm_2: '2'
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('It should map data to JSON with the correct shape', async () => {
    const result = mappers.mapToJSON(data);

    expect(result).to.be.an.object();
    expect(Object.keys(result)).to.include([
      'idm', 'crm', 'waterservice', 'permitrepo', 'virusScanner'
    ]);

    expect(result.idm).to.be.an.object();
    expect(Object.keys(result.idm)).to.include([
      'users', 'point_1', 'point_2'
    ]);

    expect(result.crm).to.be.an.object();
    expect(Object.keys(result.crm)).to.include([
      'documents', 'point_1', 'point_2', 'verifications'
    ]);

    expect(result.waterservice).to.be.an.object();
    expect(result.waterservice.import).to.be.an.object();
    expect(Object.keys(result.waterservice.import)).to.include([
      'complete', 'pending'
    ]);

    expect(result.permitrepo).to.be.an.object();
    expect(Object.keys(result.permitrepo)).to.include([
      'permits'
    ]);

    expect(result.virusScanner).to.be.a.string();
  });
});

experiment('countErrors', () => {
  test('It should count the instances of the string ERROR in an array', async () => {
    const data = [0, 1, 2, 'ERROR', 'a', 'b', 3, 'ERROR'];
    const result = mappers.countErrors(data);
    expect(result).to.equal(2);
  });
});

experiment('mapToView', () => {
  test('It should take an array of values and map to an object', async () => {
    const data = [0, 1, 2, 3, 4, 5, 6, 7, false];
    const result = mappers.mapToView(data);
    expect(result).to.equal({
      userCount: 0,
      idmKPI: 1,
      crmDocumentCount: 2,
      crmKPI: 3,
      crmVerificationCount: 4,
      permitCount: 5,
      waterPendingImports: 6,
      waterCompletedImports: 7,
      errorCount: 0,
      virusScanner: 'ERROR'
    });
  });

  test('It should count errors in input data', async () => {
    const data = [0, 1, 2, 'ERROR', 4, 5, 'ERROR', 7, 8];
    const result = mappers.mapToView(data);
    expect(result.errorCount).to.equal(2);
  });
});
