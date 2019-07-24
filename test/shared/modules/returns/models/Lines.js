const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('lab').script();
const { expect } = require('code');

const Lines = require('shared/modules/returns/models/Lines');

const createOptions = frequency => ({
  startDate: '2018-11-01',
  endDate: '2019-10-31',
  frequency: 'month'
});

const createLines = () => ([ { startDate: '2018-11-01',
  endDate: '2018-11-30',
  quantity: null },
{ startDate: '2018-12-01',
  endDate: '2018-12-31',
  quantity: null },
{ startDate: '2019-01-01',
  endDate: '2019-01-31',
  quantity: null },
{ startDate: '2019-02-01',
  endDate: '2019-02-28',
  quantity: null },
{ startDate: '2019-03-01',
  endDate: '2019-03-31',
  quantity: null },
{ startDate: '2019-04-01',
  endDate: '2019-04-30',
  quantity: null },
{ startDate: '2019-05-01',
  endDate: '2019-05-31',
  quantity: null },
{ startDate: '2019-06-01',
  endDate: '2019-06-30',
  quantity: null },
{ startDate: '2019-07-01',
  endDate: '2019-07-31',
  quantity: null },
{ startDate: '2019-08-01',
  endDate: '2019-08-31',
  quantity: null },
{ startDate: '2019-09-01',
  endDate: '2019-09-30',
  quantity: null },
{ startDate: '2019-10-01',
  endDate: '2019-10-31',
  quantity: null } ]);

const createZeroLines = () => createLines().map(line => ({
  ...line,
  quantity: 0
}));

const createAscendingLines = () => createLines().map((line, index) => ({
  ...line,
  quantity: index + 1
}));

const createInvalidLines = () => createLines().map(line => ({
  ...line,
  invalid: 'x'
}));

experiment('Lines model', () => {
  experiment('constructor', async () => {
    test('generates required lines if none supplied', async () => {
      const lines = new Lines([], createOptions());
      expect(lines.lines.length).to.equal(12);
    });

    test('initialises with supplied lines', async () => {
      const lines = new Lines([{
        startDate: '2019-01-01',
        endDate: '2019-01-31',
        quantity: 5
      }], createOptions());
      expect(lines.lines.length).to.equal(1);
    });

    test('throws an error if invalid argument for options', async () => {
      const func = () => new Lines([], 'x');
      expect(func).to.throw();
    });
  });

  experiment('toArray', () => {
    let lines;
    beforeEach(async () => {
      lines = new Lines([], createOptions());
    });

    test('returns the lines array', async () => {
      const linesArr = lines.toArray();
      expect(linesArr).to.be.an.array();
      expect(linesArr).to.have.length(12);
    });
  });

  experiment('setLines', async () => {
    let lines;

    const abstractionPeriod = {
      periodStartDay: 1,
      periodStartMonth: 8,
      periodEndDay: 1,
      periodEndMonth: 1
    };

    beforeEach(async () => {
      lines = new Lines([], createOptions());
    });

    test('sets volumes to default of 0 within abstraction period only', async () => {
      const arr = lines
        .setLines(abstractionPeriod, createLines())
        .toArray();
      const quantities = arr.map(row => row.quantity);
      expect(quantities).to.equal([ 0, 0, null, null, null, null, null, null, null, 0, 0, 0 ]);
    });

    test('sets submitted zeros to null outside abstraction period', async () => {
      const arr = lines
        .setLines(abstractionPeriod, createZeroLines())
        .toArray();
      const quantities = arr.map(row => row.quantity);
      expect(quantities).to.equal([ 0, 0, null, null, null, null, null, null, null, 0, 0, 0 ]);
    });

    test('sets values', async () => {
      const arr = lines
        .setLines(abstractionPeriod, createAscendingLines())
        .toArray();
      const quantities = arr.map(row => row.quantity);
      expect(quantities).to.equal([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ]);
    });

    test('throws error if lines do not match schema', async () => {
      const func = () => lines.setLines(abstractionPeriod, createInvalidLines());
      expect(func).to.throw();
    });

    test('throws error if lines do not match those expected', async () => {
      const data = createLines();
      data.push({
        startDate: '2019-11-01',
        endDate: '2019-11-30',
        quantity: 0
      });
      const func = () => lines.setLines(abstractionPeriod, data);
      expect(func).to.throw();
    });

    test('throws an error if a line is missing', async () => {
      const data = createLines();
      data.splice(5, 1);
      const func = () => lines.setLines(abstractionPeriod, data);
      expect(func).to.throw();
    });

    test('throws error if invalid abs period', async () => {
      const period = {
        ...abstractionPeriod,
        periodStartDay: 32,
        periodStartMonth: 13
      };
      const func = () => lines.setLines(period, createLines());
      expect(func).to.throw();
    });
  });
});
