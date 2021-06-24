'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();
const preHandlers = require('shared/lib/pre-handlers/gaugingstations');
const h = sandbox.stub();
const GAUGINGSTATION_ID = '0dd992c3-86e6-4410-963c-cc61d51bef40';
const LICENCE_ID = '22c784b7-b141-4fd0-8ee1-78ea7ae783bc';

experiment('src/shared/lib/pre-handlers/gaugingstations', () => {
  let request, result;
  beforeEach(async () => {
    request = {
      params: {
        gaugingStationId: GAUGINGSTATION_ID,
        licenceId: LICENCE_ID
      },
      services: {
        water: {
          monitoringstations: {
            getGaugingStationLicences: sandbox.stub().resolves({ data: [
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
            ] })
          }
        }
      }
    };
  });

  afterEach(() => sandbox.restore());

  experiment('.loadGaugingStations by gaugingstationsId', () => {
    beforeEach(async () => {
      result = await preHandlers.loadGaugingStations(request, h);
    });

    test('returns the result of the call to the water service', () => {
      expect(result.data.length).to.equal(1);
    });
  });
});
