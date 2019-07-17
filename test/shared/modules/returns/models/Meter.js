const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('lab').script();
const { expect } = require('code');
const sandbox = require('sinon').createSandbox();

const {
  METHOD_VOLUMES, METHOD_ONE_METER,
  READING_TYPE_MEASURED, READING_TYPE_ESTIMATED
} = require('shared/modules/returns/models/Reading');

const Meter = require('shared/modules/returns/models/Meter');
const Reading = require('shared/modules/returns/models/Reading');
const Lines = require('shared/modules/returns/models/Lines');

const createMeter = () => ({
  meterDetailsProvided: true,
  manufacturer: 'Test',
  serialNumber: '01234',
  startReading: 123,
  multiplier: 10,
  readings: {
    '2019-04-01_2019-04-30': 10,
    '2019-05-01_2019-05-31': 20,
    '2019-06-01_2019-06-30': null
  }
});

experiment('Meter', () => {
  let reading, lines;

  beforeEach(async () => {
    reading = new Reading();
    sandbox.stub(reading, 'isOneMeter');
    lines = new Lines([], {
      frequency: 'month',
      startDate: '2019-04-01',
      endDate: '2019-06-30'
    });
  });

  experiment('constructor', async () => {
    const keys = ['meterDetailsProvided', 'manufacturer', 'serialNumber',
      'startReading', 'multiplier', 'readings'];
    for (let key of keys) {
      test(`sets ${key} from supplied object data`, async () => {
        const data = createMeter();
        const meter = new Meter(reading, lines, data);
        expect(meter[key]).to.equal(data[key]);
      });
    }
  });
});
