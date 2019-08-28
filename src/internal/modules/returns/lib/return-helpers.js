const { get } = require('lodash');

/**
 * Gets line data, including meter readings if present
 * @param {Object} data
 * @return {Array} lines
 */
const getLinesWithReadings = (data) => {
  const method = get(data, 'reading.method');
  if (method === 'abstractionVolumes') {
    return data.lines;
  }

  let previousReading = get(data, 'meters[0].startReading');

  return data.lines.map(row => {
    if (row.quantity === null) {
      return row;
    }

    const readingKey = `${row.startDate}_${row.endDate}`;
    const reading = get(data, `meters[0].readings.${readingKey}`);

    const newRow = {
      ...row,
      startReading: previousReading,
      endReading: reading
    };

    previousReading = reading || previousReading;

    return newRow;
  });
};

exports.getLinesWithReadings = getLinesWithReadings;
