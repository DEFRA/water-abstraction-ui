const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const Meter = require('shared/modules/returns/models/Meter');
const Reading = require('shared/modules/returns/models/Reading');
const Lines = require('shared/modules/returns/models/Lines');

const createReadingsArray = () => ([{
  startDate: '2019-09-01',
  endDate: '2019-09-30',
  reading: 45.3
}, {
  startDate: '2019-10-01',
  endDate: '2019-10-31',
  reading: 70
}, {
  startDate: '2019-11-01',
  endDate: '2019-11-30',
  reading: null
}]);

const createReadingsObj = () => {
  const arr = createReadingsArray();
  return arr.reduce((acc, row) => {
    return {
      ...acc,
      [`${row.startDate}_${row.endDate}`]: row.reading
    };
  }, {});
};

const createMeter = () => ({
  meterDetailsProvided: true,
  manufacturer: 'Pump-u-like',
  serialNumber: '01234',
  startReading: 123,
  multiplier: 10,
  readings: createReadingsObj()
});

experiment('Meter', () => {
  let reading, lines;

  beforeEach(async () => {
    reading = new Reading({ units: 'l' });
    sandbox.stub(reading, 'isOneMeter');
    lines = new Lines([], {
      frequency: 'month',
      startDate: '2019-09-01',
      endDate: '2019-11-30'
    });
  });

  experiment('constructor', async () => {
    let meter, data;

    beforeEach(async () => {
      data = createMeter();
      meter = new Meter(reading, lines, data);
    });

    const keys = ['meterDetailsProvided', 'manufacturer', 'serialNumber',
      'startReading', 'multiplier', 'readings'];
    for (let key of keys) {
      test(`sets ${key} from supplied object data`, async () => {
        expect(meter[key]).to.equal(data[key]);
      });
    }

    test('sets the reading instance', async () => {
      expect(meter.reading).to.equal(reading);
    });

    test('sets the lines instance', async () => {
      expect(meter.lines).to.equal(lines);
    });
  });

  experiment('toObject', async () => {
    experiment('when the reading type is oneMeter', async () => {
      let meter, data, result;

      beforeEach(async () => {
        reading.isOneMeter.returns(true);
        data = createMeter();
        meter = new Meter(reading, lines, data);
        result = meter.toObject();
      });

      test('returns object with correct keys', async () => {
        expect(Object.keys(result)).to.only.include([
          'meterDetailsProvided', 'manufacturer', 'serialNumber', 'multiplier',
          'startReading', 'readings', 'units'
        ]);
      });

      test('includes meterDetailsProvided', async () => {
        expect(result.meterDetailsProvided).to.equal(true);
      });

      test('includes manufacturer', async () => {
        expect(result.manufacturer).to.equal('Pump-u-like');
      });

      test('includes serialNumber', async () => {
        expect(result.serialNumber).to.equal('01234');
      });

      test('includes multiplier', async () => {
        expect(result.multiplier).to.equal(10);
      });

      test('includes startReading', async () => {
        expect(result.startReading).to.equal(123);
      });

      test('includes readings', async () => {
        expect(result.readings).to.equal(createReadingsObj());
      });

      test('includes units', async () => {
        expect(result.units).to.equal(reading.getUnits());
      });
    });

    experiment('when the reading type is not one meter', () => {
      let result;
      beforeEach(async () => {
        reading.isOneMeter.returns(false);
        const data = createMeter();
        const meter = new Meter(reading, lines, data);
        result = meter.toObject();
      });

      test('includes the correct keys', async () => {
        expect(Object.keys(result)).to.only.include(
          ['meterDetailsProvided', 'manufacturer', 'serialNumber', 'multiplier']
        );
      });
    });
  });

  experiment('setMeterDetails', () => {
    test('sets the correct fields', async () => {
      const meter = new Meter();
      meter.setMeterDetails({
        manufacturer: 'Superpump',
        serialNumber: '0456',
        multiplier: 15,
        meterDetailsProvided: true
      });
      expect(meter.manufacturer).to.equal('Superpump');
      expect(meter.serialNumber).to.equal('0456');
      expect(meter.multiplier).to.equal(15);
      expect(meter.meterDetailsProvided).to.equal(true);
    });

    test('throws an error if invalid data is provided', async () => {
      const meter = new Meter();
      const func = () => meter.setMeterDetails({ manufacturer: false });
      expect(func).to.throw();
    });
  });

  experiment('setMeterReadings', () => {
    let meter;

    beforeEach(async () => {
      meter = new Meter();
      meter.setMeterReadings(123, createReadingsArray());
    });

    test('sets the start reading', async () => {
      expect(meter.startReading).to.equal(123);
    });

    test('sets the meter readings object from the supplied array', async () => {
      expect(meter.readings).to.equal(createReadingsObj());
    });
  });

  experiment('getStartReading', () => {
    test('gets the start reading', async () => {
      const meter = new Meter();
      meter.setMeterReadings(123, createReadingsArray());
      expect(meter.getStartReading()).to.equal(123);
    });
  });

  experiment('getEndReading', () => {
    test('gets the end reading - the last reading with a value > 0', async () => {
      const meter = new Meter();
      meter.setMeterReadings(123, createReadingsArray());
      expect(meter.getEndReading()).to.equal(70);
    });
  });

  experiment('getMultiplier', () => {
    test('gets the multiplication factor', async () => {
      const meter = new Meter(reading, lines, { multiplier: 25 });
      expect(meter.getMultiplier()).to.equal(25);
    });
  });

  experiment('getVolumes', () => {
    let meter;

    beforeEach(async () => {
      meter = new Meter(reading, lines);
      meter.setMeterReadings(10, createReadingsArray());
    });

    test('returns an array of volumes based on the meter readings and start reading', async () => {
      const volumes = meter.getVolumes(false);
      expect(volumes).to.equal([
        { startDate: '2019-09-01',
          endDate: '2019-09-30',
          timePeriod: 'month',
          quantity: 35.3 },
        { startDate: '2019-10-01',
          endDate: '2019-10-31',
          timePeriod: 'month',
          quantity: 24.7 },
        { startDate: '2019-11-01',
          endDate: '2019-11-30',
          timePeriod: 'month',
          quantity: null } ]);
    });

    test('includes the meter readings if passed true', async () => {
      const volumes = meter.getVolumes(true);
      expect(volumes).to.equal([
        { startDate: '2019-09-01',
          endDate: '2019-09-30',
          timePeriod: 'month',
          quantity: 35.3,
          endReading: 45.3 },
        { startDate: '2019-10-01',
          endDate: '2019-10-31',
          timePeriod: 'month',
          quantity: 24.7,
          endReading: 70 },
        { startDate: '2019-11-01',
          endDate: '2019-11-30',
          timePeriod: 'month',
          quantity: null,
          endReading: null } ]);
    });
  });

  experiment('isMeterDetailsProvided', () => {
    test('should return the meterDetailsProvided flag', async () => {
      const meter = new Meter(reading, lines, { meterDetailsProvided: true });
      expect(meter.isMeterDetailsProvided()).to.equal(true);
    });
  });
});
