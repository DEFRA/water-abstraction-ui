const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('lab').script();
const { expect } = require('code');

const WaterReturn = require('shared/modules/returns/models/WaterReturn');
const {
  METHOD_VOLUMES, METHOD_ONE_METER,
  READING_TYPE_MEASURED, READING_TYPE_ESTIMATED
} = require('shared/modules/returns/models/WaterReturn');

const createReturn = () => ({
  returnId: 'v1:5:01/123:1234:2018-11-01:2019-10-31',
  licenceNumber: '01/123',
  receivedDate: '2019-10-31',
  versionNumber: 1,
  isCurrent: true,
  status: 'due',
  isNil: false,
  meters: [],
  reading: {},
  lines: [{ startDate: '2018-11-01', endDate: '2018-11-30', quantity: 123 }],
  metadata: {},
  startDate: '2018-11-01',
  endDate: '2019-10-31',
  frequency: 'month',
  user: {},
  versions: []
});

const createMeter = () => ({
  manufacturer: 'Pump-u-like',
  serialNumber: '1234',
  startReading: 123,
  readings: {
    '2019-09-01_2018-09-30': 456
  },
  units: 'l',
  multiplier: 10
});

experiment('WaterReturn', () => {
  const keys = ['returnId', 'licenceNumber', 'receivedDate', 'versionNumber',
    'isCurrent', 'status', 'isNil', 'meters', 'reading', 'lines', 'metadata',
    'startDate', 'endDate', 'frequency', 'user', 'versions'];

  experiment('constructor', () => {
    for (let key in keys) {
      test(`Sets ${key} from supplied object data`, async () => {
        const data = createReturn();
        const waterReturn = new WaterReturn(data);
        expect(waterReturn[key]).to.equal(data[key]);
      });
    }
  });

  experiment('toObject', () => {
    test('returns object data', async () => {
      const data = createReturn();
      const waterReturn = new WaterReturn(data);
      const result = waterReturn.toObject();
      expect(result).to.be.an.object();
      expect(result).to.include(keys);
    });
  });

  experiment('setNilReturn', () => {
    test('sets isNil flag to false if false provided', async () => {
      const waterReturn = new WaterReturn(createReturn());
      waterReturn.setNilReturn(false);
      expect(waterReturn.isNil).to.equal(false);
    });

    test('sets isNil flag to true if true provided', async () => {
      const waterReturn = new WaterReturn(createReturn());
      waterReturn.setNilReturn(true);
      expect(waterReturn.isNil).to.equal(true);
    });

    test('throws error if non-boolean value provided', async () => {
      const waterReturn = new WaterReturn(createReturn());
      const func = () => waterReturn.setNilReturn(0);
      expect(func).to.throw();
    });
  });
});
