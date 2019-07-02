'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');

const { gaugingStationValue } = require('shared/view/nunjucks/filters/gauging-station-value');

lab.experiment('unitName === "m3/s"', () => {
  lab.test('Returns the correct value if convertTo === "m3/day"', async () => {
    const measure = { unitName: 'm3/s', latestReading: { value: 100 } };
    const result = gaugingStationValue(measure, 'm3/day');
    expect(result).to.equal('8640000.0m³/day');
  });

  lab.test('Returns the correct value if convertTo !== "m3/day"', async () => {
    const measure = { unitName: 'm3/s', latestReading: { value: 100 } };
    const result = gaugingStationValue(measure, 'm3/s');
    expect(result).to.equal('100.0m³/s');
  });
});

lab.experiment('unitName === "mASD"', () => {
  lab.test('Returns the correct value', async () => {
    const measure = { unitName: 'mASD', latestReading: { value: 100 } };
    const result = gaugingStationValue(measure);
    expect(result).to.equal('100.00m');
  });
});

lab.experiment('unknown unit', () => {
  lab.test('Returns the value and unitName', async () => {
    const measure = { unitName: 'unknown', latestReading: { value: 100 } };
    const result = gaugingStationValue(measure);
    expect(result).to.equal('100unknown');
  });
});
