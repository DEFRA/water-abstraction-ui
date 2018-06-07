'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const { expect } = require('code');

const { selectRiverLevelMeasure } = require('../../../src/modules/view-licences/helpers');

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
