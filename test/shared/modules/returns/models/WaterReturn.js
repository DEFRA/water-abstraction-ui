const moment = require('moment');
const { omit } = require('lodash');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('lab').script();
const { expect } = require('code');
const sandbox = require('sinon').createSandbox();

const WaterReturn = require('shared/modules/returns/models/WaterReturn');

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
    const data = omit(createReturn(), 'receivedDate');

    test('sets status with receivedDate defaulting to todays date', async () => {
      const today = moment().format('YYYY-MM-DD');
      const waterReturn = new WaterReturn(data);
      waterReturn.setStatus('completed');
      expect(waterReturn.status).to.equal('completed');
      expect(waterReturn.receivedDate).to.equal(today);
    });

    test('sets status with defined received date', async () => {
      const waterReturn = new WaterReturn(data);
      waterReturn.setStatus('completed', '2019-02-14');
      expect(waterReturn.status).to.equal('completed');
      expect(waterReturn.receivedDate).to.equal('2019-02-14');
    });

    test('does not set status if status is already completed', async () => {
      const waterReturn = new WaterReturn({
        ...data,
        status: 'completed'
      });
      waterReturn.setStatus('due');
      expect(waterReturn.status).to.equal('completed');
    });

    test('does not set received date if date already set', async () => {
      const waterReturn = new WaterReturn({
        ...data,
        receivedDate: '2019-02-14'
      });
      waterReturn.setStatus('completed');
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
});
