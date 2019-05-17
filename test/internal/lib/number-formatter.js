const Lab = require('lab');
const lab = Lab.script();
const Code = require('code');

const { maxPrecision } = require('../../../src/internal/lib/number-formatter');

lab.experiment('Test number formatter helpers', () => {
  lab.test('maxPrecision should reduce precision of number to fixed decimal places', async () => {
    Code.expect(maxPrecision(24.56678, 3)).to.equal('24.567');
  });

  lab.test('maxPrecision should use reduced fixed precision if not required', async () => {
    Code.expect(maxPrecision(123.42000, 4)).to.equal('123.42');
  });

  lab.test('maxPrecision should use integer if fractional not required', async () => {
    Code.expect(maxPrecision(12.00000, 7)).to.equal('12');
  });

  lab.test('maxPrecision should handle zero', async () => {
    Code.expect(maxPrecision(0.00000, 2)).to.equal('0');
  });

  lab.test('maxPrecision should handle negative numbers', async () => {
    Code.expect(maxPrecision(-46.243525, 4)).to.equal('-46.2435');
  });
});

exports.lab = lab;
