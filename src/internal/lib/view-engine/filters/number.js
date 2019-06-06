const commaNumber = require('comma-number');
const { maxPrecision } = require('../../../../shared/lib/number-formatter');

const number = value => commaNumber(maxPrecision(value, 3));

exports.number = number;
