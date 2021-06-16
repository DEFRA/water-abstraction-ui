const { expect } = require('@hapi/code');
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const mappers = require('internal/modules/gauging-stations/lib/mappers');
const badge = require('shared/view/nunjucks/filters/gauging-station-badge');

experiment('internal/modules/gauging-stations/controllers/lib/mappers', () => {
  experiment('.mapStationsLicences with missing fields', () => {
    test('handle values like undefined', async () => {
      const data = null;
      const res = mappers.mapStationsLicences(data);
      expect(res).to.equal(null);
    });
  });

  experiment('nunjucks filter gauging-station-badge', () => {
    test('reduce translate to warning badge', async () => {
      const res = badge.gaugingStationBadge({ status: 'reduce' }, false);
      expect(res.status).to.equal('warning');
      expect(res.text).to.equal('reduce');
    });
    test('no_restriction translate to success badge', async () => {
      const res = badge.gaugingStationBadge({ status: 'no_restriction' }, false);
      expect(res.status).to.equal('success');
      expect(res.text).to.equal('no restriction');
    });
    test('warning translate to warning badge', async () => {
      const res = badge.gaugingStationBadge({ status: 'warning' }, false);
      expect(res.status).to.equal('warning');
      expect(res.text).to.equal('warning');
    });
    test('stop translate to error badge', async () => {
      const res = badge.gaugingStationBadge({ status: 'stop' }, false);
      expect(res.status).to.equal('error');
      expect(res.text).to.equal('stop');
    });
  });

  experiment('.mapStationsLicences', () => {
    const newData = [{
      gaugingStationId: 'e3e95a10-a989-42ae-9692-feac91f06ffb',
      licenceId: '22c784b7-b141-4fd0-8ee1-78ea7ae783bc',
      licenceVersionPurposeConditionId: '00304a0e-0ff7-4820-a3e1-f2cd48f2ae62',
      gridReference: '1',
      easting: '2',
      northing: '3',
      wiskiId: '4',
      licenceRef: '6/33/04/*G/0068',
      abstractionPeriodStartDay: '1',
      abstractionPeriodStartMonth: '11',
      abstractionPeriodEndDay: '30',
      abstractionPeriodEndMonth: '11',
      restrictionType: 'flow',
      thresholdValue: '100',
      thresholdUnit: 'Ml',
      stationReference: '1',
      comstatus: 'reduce'
    }];

    experiment('maps the stations and licences then process stations', () => {
      test('returns null', async () => {
        const stationsLicences = mappers.mapStationsLicences(newData);
        const stations = mappers.mapStations(stationsLicences);
        expect(stations.stations[0].licenceRef).to.equal('6/33/04/*G/0068');
      });
    });

    experiment('mapTags', () => {
      test('maps the stations and licences then process tags', async () => {
        const stationsLicences = mappers.mapStationsLicences(newData);
        const stations = mappers.mapStations(stationsLicences);
        const stationAndTags = mappers.mapTags(stations);
        expect(stationAndTags.stations[0].tags[0].licenceNumber).to.equal('6/33/04/*G/0068');
      });
    });
  });
});
