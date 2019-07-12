const { isDateWithinAbstractionPeriod } = require('./return-date-helpers');
const { returns: { lines: { getRequiredLines } } } = require('@envage/water-abstraction-helpers');

/**
 * Creates lines array from data
 * @return {Object}
 * @return {Array}
 */
const createLines = (data) => {
  const { lines = [], startDate, endDate, frequency } = data;
  if (lines.length) {
    return lines;
  }
  return getRequiredLines(startDate, endDate, frequency);
};

/**
 * Gets default quantity.  If within abstraction period, this is 0, otherwise null
 * @param {Object} line - return line
 * @param {Object} abstractionPeriod - return options containing abs period data
 * @return {Number|null}
 */
const getDefaultQuantity = (line, abstractionPeriod) => {
  return isDateWithinAbstractionPeriod(line.endDate, abstractionPeriod) ? 0 : null;
};

const mapMeterLinesToVolumes = (startReading, readings) => {
  const { lines } = readings.reduce((acc, row) => {
    const { startDate, endDate, reading } = row;

    let quantity = null;
    if (reading !== null) {
      quantity = reading - acc.lastMeterReading;
      acc.lastMeterReading = reading;
    }

    acc.lines.push({ startDate, endDate, quantity });

    return acc;
  }, { lines: [], lastMeterReading: startReading });

  return lines;
};

/**
 * Gets total abstracted quantity
 * @param  {Array} lines - return lines
 * @return {Number|null}
 */
const getReturnTotal = (lines) => {
  if (!lines) {
    return null;
  }
  const filteredLines = lines.filter(line => line.quantity !== null);
  return filteredLines.length === 0 ? null : filteredLines.reduce((acc, line) => {
    return acc + parseFloat(line.quantity);
  }, 0);
};

exports.createLines = createLines;
exports.getDefaultQuantity = getDefaultQuantity;
exports.mapMeterLinesToVolumes = mapMeterLinesToVolumes;
exports.getReturnTotal = getReturnTotal;
