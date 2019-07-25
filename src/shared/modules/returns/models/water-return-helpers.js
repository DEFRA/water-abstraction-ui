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

const createLine = (row, quantity, endReading, includeReadings) => {
  const line = {
    ...row,
    quantity
  };
  return includeReadings ? { ...line, endReading } : line;
};

const getReadingKey = line => `${line.startDate}_${line.endDate}`;

/**
 * We need to introduce a multiplication and division to discard
 * the least significant part of the floating point number
 * @param  {Number} multiplier  [description]
 * @param  {Number} reading     - the current reading
 * @param  {Number} lastReading - the last reading
 * @return {Number}
 */
const calculateQuantity = (multiplier, reading, lastReading) => {
  const difference = ((100 * reading) - (100 * lastReading));
  return multiplier * difference / 100;
};

const mapMeterLinesToVolumes = (startReading, readings, lines, multiplier = 1, includeReadings = false) => {
  const result = lines.reduce((acc, line) => {
    const reading = readings[getReadingKey(line)];

    let quantity = null;
    if (reading !== null) {
      quantity = calculateQuantity(multiplier, reading, acc.lastMeterReading);
      acc.lastMeterReading = reading;
    }

    // Create line with volume and optionally meter reading
    const newLine = createLine(line, quantity, reading, includeReadings);
    acc.lines.push(newLine);

    return acc;
  }, { lines: [], lastMeterReading: startReading });

  return result.lines;
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

/**
 * Distributes a single total among the supplied abstraction period for
 * the given list of return lines
 * @param {Object} abstractionPeriod - contains abs period start/end day/month
 * @param {Array} lines - return lines
 * @param {Number} total
 * @return {Array} lines with total distributed among lines
 */
const getSingleTotalLines = (abstractionPeriod, lines, total) => {
  const indexes = lines.reduce((acc, line, index) => {
    if (isDateWithinAbstractionPeriod(line.endDate, abstractionPeriod)) {
      acc.push(index);
    }
    return acc;
  }, []);

  const perPeriod = total / indexes.length;

  return lines.map((line, i) => ({
    ...line,
    quantity: indexes.includes(i) ? perPeriod : null
  }));
};

exports.createLines = createLines;
exports.getDefaultQuantity = getDefaultQuantity;
exports.mapMeterLinesToVolumes = mapMeterLinesToVolumes;
exports.getReturnTotal = getReturnTotal;
exports.getSingleTotalLines = getSingleTotalLines;
