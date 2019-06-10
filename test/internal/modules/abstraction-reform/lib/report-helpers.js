const Lab = require('lab');
const { expect } = require('code');
const sinon = require('sinon');

const water = require('internal/lib/connectors/water');

const {
  getCSVData,
  getReportFilename
} = require('internal/modules/abstraction-reform/lib/report-helpers');

const lab = exports.lab = Lab.script();

const { report } = require('./report-data.json');

lab.experiment('getReportFilename', () => {
  lab.test('It should get a report filename', async () => {
    const result = getReportFilename('2018-11-03');
    expect(result).to.equal('2018-11-03-ar-report.csv');
  });
});

lab.experiment('getCSVData', () => {
  let stub;

  lab.before(async () => {
    stub = sinon.stub(water.arLicenceAnalyis, 'findAll');
  });

  lab.after(async () => {
    stub.restore();
  });

  lab.test('It should get report data CSV format', async () => {
    stub.resolves(report);
    const result = await getCSVData();
    expect(result).to.equal(report);
  });
});

exports.lab = lab;
