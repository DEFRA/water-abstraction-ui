const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const { canLog, incrementDateCount } = require('../../../../src/external/modules/csp/controller');

experiment('canLog', () => {
  test('returns true if there are less than 100 logs for the date', async () => {
    const date = '2018-01-01';
    const dateCounts = {
      '2018-01-01': 99
    };
    expect(canLog(date, dateCounts)).to.be.true();
  });

  test('returns false if there are 100 logs for the date', async () => {
    const date = '2018-01-01';
    const dateCounts = {
      '2018-01-01': 100
    };
    expect(canLog(date, dateCounts)).to.be.false();
  });

  test('returns false if there are 101 logs for the date', async () => {
    const date = '2018-01-01';
    const dateCounts = {
      '2018-01-01': 101
    };
    expect(canLog(date, dateCounts)).to.be.false();
  });
});

experiment('incrementDateCount', () => {
  test('sets the count to one for a new date', async () => {
    const date = '2018-01-01';
    const dateCounts = {};
    const updated = incrementDateCount(date, dateCounts);
    expect(updated).to.equal({
      [date]: 1
    });
  });

  test('increments for an existing date', async () => {
    const date = '2018-01-01';
    const dateCounts = {
      [date]: 81
    };
    const updated = incrementDateCount(date, dateCounts);
    expect(updated).to.equal({
      [date]: 82
    });
  });
});
