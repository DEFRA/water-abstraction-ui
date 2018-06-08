'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const { expect } = require('code');
const sinon = require('sinon');

const { selectRiverLevelMeasure, loadRiverLevelData } = require('../../../src/modules/view-licences/helpers');
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

lab.experiment('selectRiverLevelMeasure', () => {
  lab.test('returns the first measure if there is only one', async () => {
    const riverLevel = {
      measures: [getTestMeasure()]
    };
    const hofTypes = { cesFlow: true, cesLev: false };
    const measure = selectRiverLevelMeasure(riverLevel, hofTypes);
    expect(measure.id).to.equal('test-flow');
  });

  lab.test('returns undefined if the measure does not contain a latest reading', async () => {
    const riverLevel = { measures: [getTestMeasure('flow', false)] };
    const hofTypes = { cesFlow: true, cesLev: false };
    const measure = selectRiverLevelMeasure(riverLevel, hofTypes);
    expect(measure).to.be.undefined();
  });

  lab.test('returns level if cesLev is true and cesFlow is false', async () => {
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

  lab.test('returns undefined if cesLev is true and cesFlow is false, but no latest reading', async () => {
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

  lab.test('returns flow if cesLev is false and cesFlow is true', async () => {
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

  lab.test('returns undefined if cesLev is false and cesFlow is true, but no latest reading', async () => {
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

lab.experiment('loadRiverLevelData', () => {
  const hofTypes = { cesLevel: true, cesFlow: false };

  lab.beforeEach(async () => {
    sinon.stub(waterConnector, 'getRiverLevel');
  });

  lab.afterEach(async () => {
    waterConnector.getRiverLevel.restore();
  });

  lab.test('returns null riverLevel and measure when no station reference', async () => {
    const riverLevelData = await loadRiverLevelData(null, hofTypes);
    expect(riverLevelData).to.equal({ riverLevel: null, measure: null });
  });

  lab.test('returns the river level and measure when the station is returned', async () => {
    const response = {
      measures: [{
        latestReading: { value: 21.7 },
        parameter: 'flow',
        valueType: 'instantaneous'
      }]
    };
    waterConnector.getRiverLevel.resolves(response);
    const riverLevelData = await loadRiverLevelData(1234, hofTypes);
    expect(riverLevelData.measure).to.be.an.object();
    expect(riverLevelData.riverLevel).to.be.an.object();
  });

  lab.test('returns null riverLevel and measure when no station is found', async () => {
    waterConnector.getRiverLevel.rejects({ statusCode: 404 });
    const riverLevelData = await loadRiverLevelData(null, hofTypes);
    expect(riverLevelData).to.equal({ riverLevel: null, measure: null });
  });
});
