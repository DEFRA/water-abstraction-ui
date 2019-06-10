const { experiment, test } = exports.lab = require('lab').script();
const { expect } = require('code');

const { maxPrecision } = require('shared/lib/number-formatter');

experiment('Test number formatter helpers', () => {
  test('maxPrecision should reduce precision of number to fixed decimal places', async () => {
    expect(maxPrecision(24.56678, 3)).to.equal('24.567');
  });

  test('maxPrecision should use reduced fixed precision if not required', async () => {
    expect(maxPrecision(123.42000, 4)).to.equal('123.42');
  });

  test('maxPrecision should use integer if fractional not required', async () => {
    expect(maxPrecision(12.00000, 7)).to.equal('12');
  });

  test('maxPrecision should handle zero', async () => {
    expect(maxPrecision(0.00000, 2)).to.equal('0');
  });

  test('maxPrecision should handle negative numbers', async () => {
    expect(maxPrecision(-46.243525, 4)).to.equal('-46.2435');
  });
});
