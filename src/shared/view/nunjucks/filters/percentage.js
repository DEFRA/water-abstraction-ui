'use strict';

const percentage = (numerator, denominator, decimalPlaces = 2) => {
  const x = parseFloat(numerator);
  const y = parseFloat(denominator);

  // Prevent /0 error
  if (y === 0) {
    return null;
  }

  const value = 100 * x / y;

  return value.toFixed(decimalPlaces) + '%';
};

exports.percentage = percentage;
