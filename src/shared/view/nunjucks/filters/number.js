const commaNumber = require('comma-number')
const { maxPrecision } = require('../../../lib/number-formatter')

const number = value => commaNumber(maxPrecision(value, 6))

exports.number = number
