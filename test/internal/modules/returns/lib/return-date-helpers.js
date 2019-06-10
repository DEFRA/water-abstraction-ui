const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const returnDateHelpers = require('internal/modules/returns/lib/return-date-helpers');

experiment('getPeriodStartEnd', () => {
  experiment('when the default period is used', () => {
    test('the dates are converted to integers', async () => {
      const data = {
        reading: {
          totalCustomDates: false
        },
        metadata: {
          nald: {
            periodStartDay: '11',
            periodStartMonth: '10',
            periodEndDay: '22',
            periodEndMonth: '11'
          }
        }
      };

      const period = returnDateHelpers.getPeriodStartEnd(data);

      expect(period.periodStartDay).to.equal(11);
      expect(period.periodStartMonth).to.equal(10);
      expect(period.periodEndDay).to.equal(22);
      expect(period.periodEndMonth).to.equal(11);
    });

    test('the reading object can be undefined representing a default period', async () => {
      const data = {
        metadata: {
          nald: {
            periodStartDay: '11',
            periodStartMonth: '10',
            periodEndDay: '22',
            periodEndMonth: '11'
          }
        }
      };

      const period = returnDateHelpers.getPeriodStartEnd(data);

      expect(period.periodStartDay).to.equal(11);
      expect(period.periodStartMonth).to.equal(10);
      expect(period.periodEndDay).to.equal(22);
      expect(period.periodEndMonth).to.equal(11);
    });
  });

  experiment('when there is a custom abstraction period', () => {
    test('the custom period is used', async () => {
      const data = {
        reading: {
          totalCustomDates: true,
          totalCustomDateStart: '2018-10-20',
          totalCustomDateEnd: '2018-10-30'
        },
        metadata: {
          nald: {
            periodStartDay: '11',
            periodStartMonth: '10',
            periodEndDay: '11',
            periodEndMonth: '12'
          }
        }
      };

      const period = returnDateHelpers.getPeriodStartEnd(data);

      expect(period.periodStartDay).to.equal(20);
      expect(period.periodStartMonth).to.equal(10);
      expect(period.periodEndDay).to.equal(30);
      expect(period.periodEndMonth).to.equal(10);
    });
  });
});
