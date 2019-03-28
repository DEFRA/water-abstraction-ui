
const { expect } = require('code');
const {
  experiment,
  test
} = exports.lab = require('lab').script();

const handlebars = require('../../../src/lib/view-engine/handlebars');

experiment('getDatePart', () => {
  experiment('for a string value', () => {
    const date = '2018-01-02';

    test('the day is returned correctly', async () => {
      const day = handlebars.helpers.getDatePart(date, 'day');
      expect(day).to.equal('02');
    });

    test('the week is returned correctly', async () => {
      const month = handlebars.helpers.getDatePart(date, 'month');
      expect(month).to.equal('01');
    });

    test('the year is returned correctly', async () => {
      const year = handlebars.helpers.getDatePart(date, 'year');
      expect(year).to.equal('2018');
    });

    test('throws for an unknown date part', async () => {
      const func = () => {
        handlebars.helpers.getDatePart(date, 'week');
      };

      expect(func).to.throw('Unknown date part requested. Supports day, month and year');
    });
  });

  experiment('for a date value', () => {
    const date = new Date(2019, 2, 24);

    test('the day is returned correctly', async () => {
      const day = handlebars.helpers.getDatePart(date, 'day');
      expect(day).to.equal('24');
    });

    test('the week is returned correctly', async () => {
      const month = handlebars.helpers.getDatePart(date, 'month');
      expect(month).to.equal('3');
    });

    test('the year is returned correctly', async () => {
      const year = handlebars.helpers.getDatePart(date, 'year');
      expect(year).to.equal('2019');
    });

    test('throws for an unknown date part', async () => {
      const func = () => {
        handlebars.helpers.getDatePart(date, 'week');
      };

      expect(func).to.throw('Unknown date part requested. Supports day, month and year');
    });
  });

  test('returns undefined if the date is falsey', async () => {
    expect(handlebars.helpers.getDatePart(null, 'day')).to.be.undefined();
  });
});
