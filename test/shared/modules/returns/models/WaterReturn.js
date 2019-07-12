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

    test('generates return lines when none are present', async () => {
      const data = createReturn();
      delete data.lines;
      const waterReturn = new WaterReturn(data);
      expect(waterReturn.lines.length).to.equal(12);
    });
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

  experiment('cleanup', () => {
    test('for volumes, meter startReading, readings and units are removed', async () => {
      const waterReturn = new WaterReturn({
        ...createReturn(),
        reading: {
          method: METHOD_VOLUMES
        },
        meters: [createMeter()]
      });
      waterReturn.cleanup();
      expect(waterReturn.meters[0]).to.only.include(['manufacturer', 'serialNumber', 'multiplier']);
    });

    test('for meter readings, meter startReading, readings and units are not removed', async () => {
      const waterReturn = new WaterReturn({
        ...createReturn(),
        reading: {
          method: METHOD_ONE_METER
        },
        meters: [createMeter()]
      });
      waterReturn.cleanup();
      expect(waterReturn.meters[0]).to.equal(createMeter());
    });

    test('for nil returns, lines, meters and readings are removed', async () => {
      const waterReturn = new WaterReturn({
        ...createReturn(),
        isNil: true,
        reading: {
          method: METHOD_ONE_METER
        },
        meters: [createMeter()]
      });
      waterReturn.cleanup();
      expect(waterReturn.lines).to.be.undefined();
      expect(waterReturn.meters).to.be.undefined();
      expect(waterReturn.readings).to.be.undefined();
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

  experiment('setReadingType', () => {
    experiment('when reading type is estimated', () => {
      let waterReturn;

      beforeEach(async () => {
        waterReturn = new WaterReturn({
          ...createReturn(),
          meters: [createMeter()]
        });
        waterReturn.setReadingType(READING_TYPE_ESTIMATED);
      });

      test('sets type to estimated', async () => {
        expect(waterReturn.reading.type).to.equal(READING_TYPE_ESTIMATED);
      });

      test('clears totalFlag', async () => {
        expect(waterReturn.reading.totalFlag).to.equal(false);
      });

      test('clears meters', async () => {
        expect(waterReturn.meters).to.equal([]);
      });
    });

    experiment('when reading type is measured', () => {
      let waterReturn;

      beforeEach(async () => {
        waterReturn = new WaterReturn({
          ...createReturn(),
          meters: [createMeter()]
        });
        waterReturn.setReadingType(READING_TYPE_MEASURED);
      });

      test('sets type to measured', async () => {
        expect(waterReturn.reading.type).to.equal(READING_TYPE_MEASURED);
      });

      test('clears totalFlag', async () => {
        expect(waterReturn.reading.totalFlag).to.equal(false);
      });

      test('does not clear meters', async () => {
        expect(waterReturn.meters).to.have.length(1);
      });
    });
  });
});
