'use strict';

const Lab = require('lab');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();

const { expect } = require('code');
const sinon = require('sinon');

const { selectRiverLevelMeasure, loadRiverLevelData, mapFilter } = require('../../../src/modules/view-licences/helpers');
const waterConnector = require('../../../src/lib/connectors/water');

const getTestMeasure = (parameter = 'flow', hasLatestReading = true) => {
  const latestReading = hasLatestReading
    ? { value: 0.321 }
    : 'http://example.com';

  return {
    id: `test-${parameter}`,
    parameter,
    latestReading
  };
};

experiment('selectRiverLevelMeasure', () => {
  test('returns the first measure if there is only one', async () => {
    const riverLevel = {
      measures: [getTestMeasure()]
    };
    const hofTypes = { cesFlow: true, cesLev: false };
    const measure = selectRiverLevelMeasure(riverLevel, hofTypes);
    expect(measure.id).to.equal('test-flow');
  });

  test('returns undefined if the measure does not contain a latest reading', async () => {
    const riverLevel = { measures: [getTestMeasure('flow', false)] };
    const hofTypes = { cesFlow: true, cesLev: false };
    const measure = selectRiverLevelMeasure(riverLevel, hofTypes);
    expect(measure).to.be.undefined();
  });

  test('returns level if cesLev is true and cesFlow is false', async () => {
    const riverLevel = {
      measures: [
        getTestMeasure('flow'),
        getTestMeasure('level')
      ]
    };
    const hofTypes = { cesFlow: false, cesLev: true };
    const measure = selectRiverLevelMeasure(riverLevel, hofTypes);
    expect(measure.id).to.equal('test-level');
  });

  test('returns undefined if cesLev is true and cesFlow is false, but no latest reading', async () => {
    const riverLevel = {
      measures: [
        getTestMeasure('flow', false),
        getTestMeasure('level', false)
      ]
    };
    const hofTypes = { cesFlow: false, cesLev: true };
    const measure = selectRiverLevelMeasure(riverLevel, hofTypes);
    expect(measure).to.be.undefined();
  });

  test('returns flow if cesLev is false and cesFlow is true', async () => {
    const riverLevel = {
      measures: [
        getTestMeasure('flow'),
        getTestMeasure('level')
      ]
    };
    const hofTypes = { cesFlow: true, cesLev: false };
    const measure = selectRiverLevelMeasure(riverLevel, hofTypes);
    expect(measure.id).to.equal('test-flow');
  });

  test('returns undefined if cesLev is false and cesFlow is true, but no latest reading', async () => {
    const riverLevel = {
      measures: [
        getTestMeasure('flow', false),
        getTestMeasure('level', false)
      ]
    };
    const hofTypes = { cesFlow: true, cesLev: false };
    const measure = selectRiverLevelMeasure(riverLevel, hofTypes);
    expect(measure).to.be.undefined();
  });
});

experiment('loadRiverLevelData', () => {
  const hofTypes = { cesLevel: true, cesFlow: false };

  beforeEach(async () => {
    sinon.stub(waterConnector, 'getRiverLevel');
  });

  afterEach(async () => {
    waterConnector.getRiverLevel.restore();
  });

  test('returns null riverLevel and measure when no station reference', async () => {
    const riverLevelData = await loadRiverLevelData(null, hofTypes);
    expect(riverLevelData).to.equal({ riverLevel: null, measure: null });
  });

  test('returns the river level and measure when the station is returned', async () => {
    const response = {
      measures: [{
        latestReading: { value: 21.7 },
        parameter: 'flow',
        valueType: 'instantaneous'
      }]
    };
    const hofTypes = { cesFlow: true, cesLev: false };
    waterConnector.getRiverLevel.resolves(response);
    const riverLevelData = await loadRiverLevelData(1234, hofTypes);
    expect(riverLevelData.measure).to.be.an.object();
    expect(riverLevelData.riverLevel).to.be.an.object();
  });

  test('does not return flow if only level HoF type in licence', async () => {
    const response = {
      measures: [{
        latestReading: { value: 21.7 },
        parameter: 'flow',
        valueType: 'instantaneous'
      }]
    };
    const hofTypes = { cesFlow: false, cesLev: true };
    waterConnector.getRiverLevel.resolves(response);
    const riverLevelData = await loadRiverLevelData(1234, hofTypes);
    expect(riverLevelData.measure).to.be.undefined();
    expect(riverLevelData.riverLevel).to.be.an.object();
  });

  test('does not return level if only flow HoF type in licence', async () => {
    const response = {
      measures: [{
        latestReading: { value: 21.7 },
        parameter: 'level',
        valueType: 'instantaneous'
      }]
    };
    const hofTypes = { cesFlow: true, cesLev: false };
    waterConnector.getRiverLevel.resolves(response);
    const riverLevelData = await loadRiverLevelData(1234, hofTypes);
    expect(riverLevelData.measure).to.be.undefined();
    expect(riverLevelData.riverLevel).to.be.an.object();
  });

  test('returns null riverLevel and measure when no station is found', async () => {
    waterConnector.getRiverLevel.rejects({ statusCode: 404 });
    const riverLevelData = await loadRiverLevelData(null, hofTypes);
    expect(riverLevelData).to.equal({ riverLevel: null, measure: null });
  });
});

experiment('mapFilter', () => {
  test('adds the company entity id to the filter', async () => {
    const filter = mapFilter('1234', {});
    expect(filter.company_entity_id).to.equal('1234');
  });

  test('adds the licence number to the filter if supplied', async () => {
    const filter = mapFilter('1234', { licenceNumber: 'lic-num-123' });
    expect(filter.string).to.equal('lic-num-123');
  });

  test('trims the licence number', async () => {
    let filter = mapFilter('1234', { licenceNumber: '  lic-num-123' });
    expect(filter.string).to.equal('lic-num-123');

    filter = mapFilter('1234', { licenceNumber: '  lic-num-123  ' });
    expect(filter.string).to.equal('lic-num-123');

    filter = mapFilter('1234', { licenceNumber: 'lic-num-123  ' });
    expect(filter.string).to.equal('lic-num-123');
  });

  test('adds the email address to the filter if supplied', async () => {
    const filter = mapFilter('1234', { emailAddress: 'test@example.com' });
    expect(filter.email).to.equal('test@example.com');
  });

  test('trims the email address', async () => {
    let filter = mapFilter('1234', { emailAddress: '  left@example.com' });
    expect(filter.email).to.equal('left@example.com');

    filter = mapFilter('1234', { emailAddress: '  both@example.com  ' });
    expect(filter.email).to.equal('both@example.com');

    filter = mapFilter('1234', { emailAddress: 'right@example.com  ' });
    expect(filter.email).to.equal('right@example.com');
  });
});
