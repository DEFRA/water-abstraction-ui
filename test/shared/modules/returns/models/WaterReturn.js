const { omit } = require('lodash');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const { set } = require('lodash');

const WaterReturn = require('shared/modules/returns/models/WaterReturn');
const { METHOD_ONE_METER, METHOD_VOLUMES, READING_TYPE_ESTIMATED } = require('shared/modules/returns/models/Reading');

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
  metadata: {
    nald: {
      periodStartDay: 1,
      periodStartMonth: 4,
      periodEndDay: 31,
      periodEndMonth: 10
    }
  },
  startDate: '2018-11-01',
  endDate: '2019-10-31',
  frequency: 'month',
  user: {},
  versions: []
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

    test('omits lines, meters and reading when nil return', async () => {
      const data = {
        ...createReturn(),
        isNil: true
      };
      const waterReturn = new WaterReturn(data);
      const result = waterReturn.toObject();

      expect(Object.keys(result)).to.not.include(['lines', 'meters', 'reading']);
    });

    test('meters array is empty when reading type is estimated', async () => {
      const data = createReturn();
      set(data, 'reading.type', READING_TYPE_ESTIMATED);
      const waterReturn = new WaterReturn(data);
      const result = waterReturn.toObject();
      expect(result.meters).to.equal([]);
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

  experiment('setUser', () => {
    const email = 'mail@example.com';
    const entityId = 'e3301b0a-1b0a-4789-aad8-5847483adacf';

    test('sets internal user', async () => {
      const waterReturn = new WaterReturn(createReturn());
      waterReturn.setUser(email, entityId, true);
      expect(waterReturn.user).to.equal({
        email,
        entityId,
        type: 'internal'
      });
    });

    test('sets external user', async () => {
      const waterReturn = new WaterReturn(createReturn());
      waterReturn.setUser(email, entityId, false);
      expect(waterReturn.user).to.equal({
        email,
        entityId,
        type: 'external'
      });
    });

    test('throws an error if invalid email', async () => {
      const waterReturn = new WaterReturn(createReturn());
      const func = () => waterReturn.setUser('not-an-email', entityId, false);
      expect(func).to.throw();
    });

    test('throws an error if invalid entity ID', async () => {
      const waterReturn = new WaterReturn(createReturn());
      const func = () => waterReturn.setUser(email, 'not-a-guid', false);
      expect(func).to.throw();
    });

    test('throws an error if invalid internal/external user flag', async () => {
      const waterReturn = new WaterReturn(createReturn());
      const func = () => waterReturn.setUser(email, entityId, 'not-a-boolean');
      expect(func).to.throw();
    });
  });

  experiment('setStatus', () => {
    let data;
    beforeEach(async () => {
      data = createReturn();
    });

    test('sets status if status not completed', async () => {
      const waterReturn = new WaterReturn(data);
      waterReturn.setStatus('completed');
      expect(waterReturn.status).to.equal('completed');
    });

    test('does not set status if status is already completed', async () => {
      const waterReturn = new WaterReturn({
        ...data,
        status: 'completed'
      });
      waterReturn.setStatus('due');
      expect(waterReturn.status).to.equal('completed');
    });
  });

  experiment('setReceivedDate', () => {
    const data = omit(createReturn(), 'receivedDate');

    test('sets the received date', async () => {
      const waterReturn = new WaterReturn(data);
      waterReturn.setReceivedDate('2019-02-14');
      expect(waterReturn.receivedDate).to.equal('2019-02-14');
    });
  });

  experiment('setLines', () => {
    let waterReturn, ret;

    const lineData = [{
      startDate: '2019-04-01',
      endDate: '2019-04-31',
      quantity: 123
    }];

    beforeEach(async () => {
      ret = createReturn();
      waterReturn = new WaterReturn(ret);
      sandbox.stub(waterReturn.lines, 'setLines');
      waterReturn.setLines(lineData);
    });

    test('sets line data using the default abstraction period', async () => {
      const [ period, lines ] = waterReturn.lines.setLines.lastCall.args;
      expect(period.periodStartDay).to.equal(ret.metadata.nald.periodStartDay);
      expect(period.periodStartMonth).to.equal(ret.metadata.nald.periodStartMonth);
      expect(period.periodEndDay).to.equal(ret.metadata.nald.periodEndDay);
      expect(period.periodEndMonth).to.equal(ret.metadata.nald.periodEndMonth);
      expect(lines).to.equal(lineData);
    });
  });

  experiment('getLines', () => {
    let waterReturn;

    beforeEach(async () => {
      const ret = createReturn();
      waterReturn = new WaterReturn(ret);
      sandbox.stub(waterReturn.meter, 'getVolumes');
      sandbox.stub(waterReturn.lines, 'toArray');
    });

    test('returns undefined when nil return', async () => {
      waterReturn.setNilReturn(true);
      const result = waterReturn.getLines();
      expect(result).to.equal(undefined);
    });

    test('returns volumes using meter.getVolumes when meter readings', async () => {
      waterReturn.reading.setMethod(METHOD_ONE_METER);
      waterReturn.getLines(true);
      expect(
        waterReturn.meter.getVolumes.calledWith(true)
      ).to.equal(true);
    });

    test('returns volumes using lines.toArray when volumes', async () => {
      waterReturn.reading.setMethod(METHOD_VOLUMES);
      waterReturn.getLines();
      expect(
        waterReturn.lines.toArray.callCount
      ).to.equal(1);
    });
  });

  experiment('updateSingleTotalLines', () => {
    let waterReturn;

    beforeEach(async () => {
      const ret = createReturn();
      waterReturn = new WaterReturn(ret);
      sandbox.stub(waterReturn.reading, 'getSingleTotal').returns(500);
      sandbox.stub(waterReturn.lines, 'setSingleTotal');
    });

    test('calls setSingleTotal on the lines instance', async () => {
      const result = waterReturn.updateSingleTotalLines();

      const [absPeriod, total] = waterReturn.lines.setSingleTotal.lastCall.args;

      expect(absPeriod).to.equal({ periodEndDay: 31,
        periodEndMonth: 10,
        periodStartDay: 1,
        periodStartMonth: 4 });
      expect(total).to.equal(500);
      expect(result).to.equal(waterReturn);
    });
  });

  experiment('incrementVersionNumber', () => {
    let waterReturn;
    beforeEach(async () => {
      waterReturn = new WaterReturn(createReturn());
    });

    test('starts version numbering at 1 if undefined', async () => {
      waterReturn.versionNumber = undefined;
      waterReturn.incrementVersionNumber();
      expect(waterReturn.versionNumber).to.equal(1);
      expect(waterReturn.isCurrent).to.equal(true);
    });

    test('increments version numbering', async () => {
      waterReturn.versionNumber = 3;
      waterReturn.incrementVersionNumber();
      expect(waterReturn.versionNumber).to.equal(4);
      expect(waterReturn.isCurrent).to.equal(true);
    });
  });

  experiment('getAbstractionPeriod', async () => {
    let waterReturn;
    beforeEach(async () => {
      waterReturn = new WaterReturn(createReturn());
    });

    test('gets abstraction period using nald metadata', async () => {
      const period = waterReturn.getAbstractionPeriod();
      expect(period).to.equal({
        periodEndDay: 31,
        periodEndMonth: 10,
        periodStartDay: 1,
        periodStartMonth: 4
      });
    });

    test('gets custom abstraction period if set in reading', async () => {
      waterReturn.reading.setCustomAbstractionPeriod(true, '2019-02-14', '2019-04-01');
      const period = waterReturn.getAbstractionPeriod();
      expect(period).to.equal({
        periodEndDay: 1,
        periodEndMonth: 4,
        periodStartDay: 14,
        periodStartMonth: 2
      });
    });
  });

  experiment('getReturnTotal', async () => {
    test('returns total volume of all lines', async () => {
      const waterReturn = new WaterReturn(createReturn());
      expect(waterReturn.getReturnTotal()).to.equal(123);
    });
  });

  experiment('isNilReturn', async () => {
    let waterReturn;
    beforeEach(async () => {
      waterReturn = new WaterReturn(createReturn());
    });

    test('returns true if nil return flag set', async () => {
      waterReturn.isNil = true;
      expect(waterReturn.isNilReturn()).to.equal(true);
    });

    test('returns false if nil return flag not set', async () => {
      waterReturn.isNil = false;
      expect(waterReturn.isNilReturn()).to.equal(false);
    });
  });

  experiment('setUnderQuery', () => {
    let waterReturn;
    beforeEach(async () => {
      waterReturn = new WaterReturn(createReturn());
    });

    test('sets under query flag', async () => {
      waterReturn.setUnderQuery(true);
      expect(waterReturn.isUnderQuery).to.equal(true);
    });

    test('clears under query flag', async () => {
      waterReturn.setUnderQuery(false);
      expect(waterReturn.isUnderQuery).to.equal(false);
    });
  });
});
