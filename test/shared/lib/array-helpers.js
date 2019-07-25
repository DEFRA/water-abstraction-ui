const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { forceArray } = require('shared/lib/array-helpers');

experiment('lib/array-helpers', () => {
  experiment('forceArray', () => {
    test('creates an empty array for null', async () => {
      expect(forceArray(null)).to.equal([]);
    });

    test('creates an empty array for undefined', async () => {
      expect(forceArray()).to.equal([]);
    });

    test('returns the passed array', async () => {
      expect(forceArray([1, 3, 5])).to.equal([1, 3, 5]);
    });

    test('wraps a non array argument in an array', async () => {
      expect(forceArray('wrap-me')).to.equal(['wrap-me']);
    });
  });
});
