const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();
const { getReportRequestOptions } = require('internal/lib/connectors/returns-reports');

experiment('getReportRequestOptions', () => {
  test('It should create options for a user details report request', async () => {
    const result = getReportRequestOptions('userDetails');
    expect(result.uri).to.include('/user-details');
  });

  test('It should create options for a status report request', async () => {
    const result = getReportRequestOptions('statuses');
    expect(result.uri).to.include('/return-statuses');
  });

  test('It should create options for a status report request', async () => {
    const result = getReportRequestOptions('licenceCount');
    expect(result.uri).to.include('/licence-count');
  });

  test('It should create options for a status report request', async () => {
    const result = getReportRequestOptions('frequencies');
    expect(result.uri).to.include('/returns-frequencies');
  });

  test('It should default to water abstraction licences in the filter', async () => {
    const result = getReportRequestOptions('frequencies');
    const filter = JSON.parse(result.qs.filter);

    expect(filter).to.equal({
      regime: 'water',
      licence_type: 'abstraction'
    });
  });

  test('It should be possible to specify additional filter params', async () => {
    const result = getReportRequestOptions('frequencies', { end_date: '2018-10-31' });
    const filter = JSON.parse(result.qs.filter);

    expect(filter).to.equal({
      regime: 'water',
      licence_type: 'abstraction',
      end_date: '2018-10-31'
    });
  });

  test('It should have json flag set to true', async () => {
    const result = getReportRequestOptions('frequencies');
    expect(result.json).to.equal(true);
  });

  test('It should be a GET request', async () => {
    const result = getReportRequestOptions('frequencies');
    expect(result.method).to.equal('GET');
  });
});
