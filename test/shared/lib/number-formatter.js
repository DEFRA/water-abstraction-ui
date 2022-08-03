const { experiment, test } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const { maxPrecision, formatCurrency } = require('shared/lib/number-formatter')

experiment('Test number formatter helpers', () => {
  experiment('.maxPrecision', () => {
    test('should reduce precision of number to fixed decimal places', () => {
      expect(maxPrecision(24.56678, 3)).to.equal('24.567')
    })

    test('should use reduced fixed precision if not required', () => {
      expect(maxPrecision(123.42000, 4)).to.equal('123.42')
    })

    test('should use integer if fractional not required', () => {
      expect(maxPrecision(12.00000, 7)).to.equal('12')
    })

    test('should handle zero', () => {
      expect(maxPrecision(0.00000, 2)).to.equal('0')
    })

    test('should handle negative numbers', () => {
      expect(maxPrecision(-46.243525, 4)).to.equal('-46.2435')
    })
  })

  experiment('.formatCurrency', () => {
    experiment('when the value is negative', () => {
      test('should not be signed if showSign not specified', () => {
        expect(formatCurrency(-6678)).to.equal('66.78')
      })

      test('should be signed if showSign is specified', () => {
        expect(formatCurrency(-6678, true)).to.equal('-66.78')
      })
    })

    test('should return a value with 2 decimal places', () => {
      expect(formatCurrency(6678)).to.equal('66.78')
    })

    test('should not have the currency symbol if showCurrency not specified', () => {
      expect(formatCurrency(6678, false)).to.equal('66.78')
    })

    test('should add the currency symbol if showCurrency is true', () => {
      expect(formatCurrency(6678, false, true)).to.equal('£66.78')
    })

    test('should still return a zero with 2 decimal places', () => {
      expect(formatCurrency(0)).to.equal('0.00')
    })

    test('should add the currency symbol after the negative sign but before numbers', () => {
      expect(formatCurrency(-462, true, '£')).to.equal('-£4.62')
    })

    test('tolerates a string representation of a number', () => {
      expect(formatCurrency('-462', true, '£')).to.equal('-£4.62')
      expect(formatCurrency('6678', false)).to.equal('66.78')
    })

    test('returns a bad numeric if passed', () => {
      expect(formatCurrency('potatoes')).to.equal('potatoes')
    })

    test('does convert pounds to pence if penceToPounds is not specified', () => {
      expect(formatCurrency('12345')).to.equal('123.45')
    })

    test('does NOT convert pounds to pence if penceToPounds is false', () => {
      expect(formatCurrency('12345', false, false, false)).to.equal('12,345.00')
    })
  })
})
