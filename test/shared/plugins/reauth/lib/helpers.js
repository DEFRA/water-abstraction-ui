const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const helpers = require('shared/plugins/reauth/lib/helpers');
const moment = require('moment');

experiment('helpers', () => {
  experiment('.isExpired', () => {
    test('returns true if expiry time is falsey', () => {
      const result = helpers.isExpired();
      expect(result).to.equal(true);
    });

    test('returns true if expiry time is in the past', async () => {
      const t = moment().subtract(1, 'minute').format();
      const result = helpers.isExpired(t);
      expect(result).to.equal(true);
    });

    test('returns false if expiry time is in the future', async () => {
      const t = moment().add(1, 'minute').format();
      const result = helpers.isExpired(t);
      expect(result).to.equal(false);
    });
  });

  experiment('.getExpiryTime', () => {
    test('returns a timestamp 10 minutes in the future', () => {
      const t = '2019-08-12T11:00:00';
      const result = helpers.getExpiryTime(t);
      expect(moment(result).diff(t, 'minutes')).to.equal(10);
    });
  });
});
