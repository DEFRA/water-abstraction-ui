const Lab = require('lab');
const { expect } = require('code');
const sinon = require('sinon');

const water = require('../../../../src/lib/connectors/water');

const {
  getCSVData,
  getReportFilename
} = require('../../../../src/modules/abstraction-reform/lib/report-helpers');

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
    expect(result).to.equal(`licence_ref,status,region_code,start_date,review_date,approved_date,contact_correct
01/123,Approved,8,2018-07-19T08:13:44.000Z,2018-07-20T08:13:16.000Z,,1
04/567,Approved,8,2018-07-24T13:13:30.000Z,2018-07-24T13:16:36.000Z,2018-11-29T10:21:49.000Z,1
`);
  });
});

exports.lab = lab;
