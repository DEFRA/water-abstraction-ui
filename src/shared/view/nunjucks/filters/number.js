const commaNumber = require('comma-number');
const { maxPrecision } = require('../../../lib/number-formatter');

const number = value => commaNumber(maxPrecision(value, 3));

exports.number = number;
