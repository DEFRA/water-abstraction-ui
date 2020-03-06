const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { maxPrecision, penceToPound } = require('shared/lib/number-formatter');

experiment('Test number formatter helpers', () => {
  experiment('.maxPrecision', () => {
    test('should reduce precision of number to fixed decimal places', async () => {
      expect(maxPrecision(24.56678, 3)).to.equal('24.567');
    });

    test('should use reduced fixed precision if not required', async () => {
      expect(maxPrecision(123.42000, 4)).to.equal('123.42');
    });

    test('should use integer if fractional not required', async () => {
      expect(maxPrecision(12.00000, 7)).to.equal('12');
    });

    test('should handle zero', async () => {
      expect(maxPrecision(0.00000, 2)).to.equal('0');
    });

    test('should handle negative numbers', async () => {
      expect(maxPrecision(-46.243525, 4)).to.equal('-46.2435');
    });
  });

  experiment('.penceToPound', () => {
    test('should return a value with 2 decimal places', async () => {
      expect(penceToPound(6678)).to.equal('66.78');
    });
    test('should not have the currency symbol if not provided', async () => {
      expect(penceToPound(6678, false)).to.equal('66.78');
    });
    test('should add the currency symbol if provided', async () => {
      expect(penceToPound(6678, false, '£')).to.equal('£66.78');
    });
    test('should still return a zero with 2 decimal places', async () => {
      expect(penceToPound(0)).to.equal('0.00');
    });
    test('should handle negative numbers', async () => {
      expect(penceToPound(-462, true)).to.equal('-4.62');
    });

    test('should add the currency symbol after the negative sign but before numbers', async () => {
      expect(penceToPound(-462, true, '£')).to.equal('-£4.62');
    });
  });
});
