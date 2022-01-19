'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();
const preHandlers = require('../../../../../src/internal/modules/gauging-stations/lib/prehandlers');
const services = require('../../../../../src/internal/lib/connectors/services');
const h = sandbox.stub();
const GAUGINGSTATION_ID = '0dd992c3-86e6-4410-963c-cc61d51bef40';
const LICENCE_ID = '22c784b7-b141-4fd0-8ee1-78ea7ae783bc';

experiment('prehandlers', () => {
  let request;
  beforeEach(async () => {
    request = {
      params: {
        gaugingStationId: GAUGINGSTATION_ID,
        licenceId: LICENCE_ID
      }
    };
    sandbox.stub(services.water.gaugingStations, 'getGaugingStationbyId').resolves();
    sandbox.stub(services.water.gaugingStations, 'getGaugingStationLicences').resolves([]);
  });

  afterEach(() => sandbox.restore());

  experiment('.loadGaugingStation by gaugingstationsId', () => {
    beforeEach(async () => {
      await preHandlers.loadGaugingStation(request, h);
    });

    test('it calls the relevant service method', () => {
      expect(services.water.gaugingStations.getGaugingStationbyId.calledWith(GAUGINGSTATION_ID)).to.be.true();
    });
  });
});
experiment('.gaugingstations pre-handlers with testdata', () => {
  let request, result;
  beforeEach(async () => {
    request = {
      params: {
        gaugingStationId: GAUGINGSTATION_ID,
        licenceId: LICENCE_ID
      },
      services: {
        water: {
          gaugingStations: {
            getGaugingStationbyId: {
              data: [
                {
                  gaugingStationId: '0dd992c3-86e6-4410-963c-cc61d51bef40',
                  label: 'SHIPTON BELLINGER RL',
                  lat: '51.2085',
                  long: '-1.67022',
                  easting: null,
                  northing: null,
                  gridReference: 'SU2313445529',
                  catchmentName: '',
                  riverName: '',
                  wiskiId: '432404',
                  stationReference: '',
                  status: null,
                  metadata: null,
                  dateCreated: '2021-05-28T18:00:03.000Z',
                  dateUpdated: '2021-06-02T12:00:03.000Z',
                  hydrologyStationId: '7170e3a3-9e13-43a8-99f1-115fa6350b13'
                }
              ]
            },
            getGaugingStationsByLicenceId: {
              data: [
                {
                  label: 'Currymoor Drove Tilting Weir',
                  gaugingStationId: 'e3e95a10-a989-42ae-9692-feac91f06ffb'
                }
              ]
            },
            getGaugingStationLicences: {
              data: [
                {
                  abstractionPeriodStartDay: 1,
                  abstractionPeriodStartMonth: 6,
                  abstractionPeriodEndDay: 30,
                  abstractionPeriodEndMonth: 11,
                  restrictionType: 'flow',
                  thresholdValue: '175',
                  thresholdUnit: 'Ml/d',
                  comstatus: 'reduce',
                  dateStatusUpdated: '2021-06-14T09:09:31.000Z',
                  licenceRef: '11/42/18.6.2/262',
                  startDate: '1965-11-26',
                  label: 'Currymoor Drove Tilting Weir',
                  gridReference: 'ST3160027132',
                  catchmentName: '',
                  riverName: '',
                  wiskiId: '530514',
                  stationReference: '',
                  easting: null,
                  northing: null
                }
              ]
            }
          }
        }
      }
    };
  });

  afterEach(() => sandbox.restore());

  experiment('.loadGaugingStations by gaugingstationsId', () => {
    beforeEach(async () => {
      sandbox.stub(services.water.gaugingStations, 'getGaugingStationbyId').resolves(request.services.water.gaugingStations.getGaugingStationbyId);
      result = await preHandlers.loadGaugingStation(request, h);
    });

    test('returns the result of the call to the water service', () => {
      expect(result.data.length).to.equal(1);
      expect(result.data[0].label).to.equal('SHIPTON BELLINGER RL');
      expect(result.data[0].lat).to.equal('51.2085');
    });
  });
  experiment('.loadGaugingStationsByLicenceId', () => {
    beforeEach(async () => {
      sandbox.stub(services.water.gaugingStations, 'getGaugingStationsByLicenceId').resolves(request.services.water.gaugingStations.getGaugingStationsByLicenceId);
      result = await preHandlers.loadGaugingStationsByLicenceId(request, h);
    });

    test('returns a list of gaugingstations', () => {
      expect(result.data.length).to.equal(1);
      expect(result.data[0].label).to.equal('Currymoor Drove Tilting Weir');
      expect(result.data[0].gaugingStationId).to.equal('e3e95a10-a989-42ae-9692-feac91f06ffb');
    });
  });
  experiment('.loadGaugingStationLicences by gaugingstationsId', () => {
    beforeEach(async () => {
      sandbox.stub(services.water.gaugingStations, 'getGaugingStationLicences').resolves(request.services.water.gaugingStations.getGaugingStationLicences);
      result = await preHandlers.loadGaugingStationLicences(request, h);
    });

    test('returns the result of the call to the water service', () => {
      expect(result.data.length).to.equal(1);
      expect(result.data[0].comstatus).to.equal('reduce');
      expect(result.data[0].dateStatusUpdated).to.equal('2021-06-14T09:09:31.000Z');
    });
  });
});
