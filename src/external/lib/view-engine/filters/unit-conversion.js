const { convertToCubicMetres } = require('../../../../shared/lib/unit-conversion');

const unitConversion = (value, unit) => convertToCubicMetres(value, unit);

exports.unitConversion = unitConversion;
