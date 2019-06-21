const { experiment, test } = exports.lab = require('lab').script();
const { expect } = require('code');
//
const { selectRiverLevelMeasure } = require('shared/plugins/view-licence/lib/river-level');

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
