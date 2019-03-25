const Boom = require('boom');
const { get, omit, cloneDeep, set, isArray, isBoolean } = require('lodash');
const moment = require('moment');
const { maxPrecision } = require('../../../lib/number-formatter');
const { getPeriodStartEnd, isDateWithinAbstractionPeriod } = require('./return-date-helpers');
/**
 * Sets up data model for external user
 * External users do not have the option to enter a single total figure
 * so this must be set to false so that it validates
 * @param {Object} data return data model
 * @return {Object} data updated return data model
 */
const applyExternalUser = (data) => {
  const d = cloneDeep(data);
  set(d, 'reading.totalFlag', false);
  set(d, 'reading.total', null);
  return d;
};

/**
 * Applies single total to lines by distributing the value among all
 * lines within abstraction period
 * Period start day/month
 * Period end day/month
 * @param {Object} data - return data model
 * @param {Number} total - single total value
 * @return {Object} data - updated return data model
 */
const applySingleTotal = (data, total) => {
  const d = cloneDeep(data);

  // Set single total
  set(d, 'reading.totalFlag', true);
  set(d, 'reading.total', total);

  // Get period start/end and convert to integers
  const options = getPeriodStartEnd(d);

  const lines = getFormLines(d);

  // Find which return lines are within abstraction period
  if (lines) {
    const indexes = lines.reduce((acc, line, index) => {
      if (isDateWithinAbstractionPeriod(line.endDate, options)) {
        acc.push(index);
      }
      return acc;
    }, []);

    const perMonth = total / indexes.length;

    d.lines = lines.map((line, i) => {
      return {
        ...line,
        quantity: indexes.includes(i) ? perMonth : null
      };
    });
  }

  return d;
};

/**
 * Applies data from returns basis form to model
 * and returns new model data
 * @param {Object} - return model
 * @param {Object} - basis form data
 * @return {Object} - updated return model
 */
const applyBasis = (data, formValues) => {
  const { basis } = formValues;
  const f = cloneDeep(data);

  set(f, 'reading.type', basis);

  delete f.meters;

  return f;
};

/**
 * Applies the method of return - either volumes or meter readings
 * @param {Object} - return model
 * @param {String} - comma separated list of reading method and type
 * @return {Object} - updated return model
 */
const applyMethod = (data, method) => {
  const d = cloneDeep(data);
  const [readingMethod, readingType] = method.split(',');

  set(d, 'reading.method', readingMethod);
  set(d, 'reading.type', readingType);

  if (readingMethod === 'abstractionVolumes') {
    const meters = d.meters || [];
    for (let meter of meters) {
      delete meter.readings;
      delete meter.startReading;
      delete meter.units;
    }
  }

  return d;
};

/**
 * Returns form lines
 * @param {Object} returns data model
 * @return {Array} returns lines if set and not empty, otherwise required lines
 */
const getFormLines = (data) => {
  return data.lines && data.lines.length ? data.lines : data.requiredLines;
};

const getMeter = data => {
  return get(data, 'meters[0]', {});
};

/**
 * Applies form lines values to data
 * @param {Object} - return model
 * @param {Object} - basis form data
 * @return {Object} - updated return model
 */
const applyQuantities = (data, formValues) => {
  const f = cloneDeep(data);

  const options = getPeriodStartEnd(f);

  const lines = getFormLines(f);

  f.lines = lines.map(line => {
    const defaultValue = getDefaultQuantity(line, options);

    const name = line.startDate + '_' + line.endDate;
    return {
      ...line,
      quantity: formValues[name] || defaultValue
    };
  });

  return f;
};

/**
 * Applies user details to the return
 * @param {Object} data - returns model
 * @param {Object} credentials - request.auth.credentials for current user
 * @return {Object} returns model with user data added
 */
const applyUserDetails = (data, credentials) => {
  const d = cloneDeep(data);
  const { username, scope, entity_id: entityId } = credentials;
  return {
    ...d,
    user: {
      email: username,
      type: scope.includes('internal') ? 'internal' : 'external',
      entityId
    }
  };
};

/**
 * Applies nil return to return data model
 * @param {Object} data
 * @param {Boolean} isNil
 * @return {Object}
 */
const applyNilReturn = (data, isNil) => {
  const d = cloneDeep(data);
  d.isNil = isNil;
  if (isNil) {
    delete d.lines;
    delete d.meters;
    delete d.reading;
  }
  return d;
};

/**
 * Applys received date and completed status to return
 * @param {Object} data - return data model
 * @param {String} [status] - status to set to, defaults to 'completed'
 * @param {String} [receivedDate] - ISO 8601 date string, YYYY-MM-DD
 * @return {Object} updated return data model
 */
const applyStatus = (data, status = 'completed', receivedDate) => {
  if (!['completed', 'due', 'received'].includes(status)) {
    throw Boom.badImplementation(`Invalid return status ${status}`);
  }
  const d = cloneDeep(data);
  if (!d.receivedDate) {
    d.receivedDate = moment(receivedDate).format('YYYY-MM-DD');
  }
  // Don't allow a completed return to go back to an earlier status
  if (d.status !== 'completed') {
    d.status = status;
  }
  return d;
};

const applyMeterDetails = (data, formValues) => {
  const clone = cloneDeep(data);

  const arr = formValues.isMultiplier || [];
  const multiplier = arr.includes('multiply') ? 10 : 1;

  const details = {
    manufacturer: formValues.manufacturer,
    serialNumber: formValues.serialNumber,
    multiplier
  };

  const meter = Object.assign(getMeter(data), details);
  return set(clone, 'meters', [meter]);
};

const applyMeterUnits = (data, formValues) => {
  const { units } = formValues;
  if (['m³', 'l', 'Ml', 'gal'].includes(units)) {
    const clone = cloneDeep(data);
    set(clone, 'meters[0].units', units);
    set(clone, 'reading.units', units);
    return set(clone, 'reading.type', 'measured');
  }
  throw new Error('Unexpected unit');
};

/**
 * Gets label text for line
 * @param {Object} line from requiredLines array
 * @return {String} label
 */
const getLineLabel = (line) => {
  if (line.timePeriod === 'day') {
    return moment(line.startDate).format('D MMMM');
  }
  if (line.timePeriod === 'week') {
    return 'Week ending ' + moment(line.endDate).format('D MMMM');
  }
  if (line.timePeriod === 'month') {
    return moment(line.startDate).format('MMMM');
  }
  if (line.timePeriod === 'year') {
    return moment(line.startDate).format('D MMMM YYYY - ') + moment(line.endDate).format('D MMMM YYYY');
  }
};

/**
 * Get form field name
 * @param {Object} line
 * @return {String} field name
 */
const getLineName = (line) => {
  return line.startDate + '_' + line.endDate;
};

const getLineValues = (lines) => {
  return lines.reduce((acc, line) => {
    const name = getLineName(line);
    return {
      ...acc,
      [name]: maxPrecision(line.quantity, 3)
    };
  }, {});
};

/**
 * Gets default quantity.  If within abstraction period, this is 0, otherwise null
 * @param {Object} line - return line
 * @param {Object} options - return options containing abs period data
 * @return {Number|null}
 */
const getDefaultQuantity = (line, options) => {
  return isDateWithinAbstractionPeriod(line.endDate, options) ? 0 : null;
};

const applyMeterReadings = (data, formValues) => {
  const updated = cloneDeep(data);

  const lines = getFormLines(updated);
  const { multiplier = 1 } = data.meters[0];

  const options = getPeriodStartEnd(updated);

  const input = {
    lines: [],
    lastMeterReading: formValues.startReading
  };

  const readings = lines.reduce((acc, line) => {
    const value = formValues[getLineName(line)];

    // get the meter reading, or set to null if zero or null
    const meterReading = value === '' ? null : value;

    // The quantity defaults to null, or 0 within authorised abstraction period
    let quantity = getDefaultQuantity(line, options);

    if (meterReading !== null) {
      // get the quantity and multiply. Set to null for zero.
      quantity = ((meterReading - acc.lastMeterReading) * multiplier);
      acc.lastMeterReading = meterReading;
    }

    acc.lines.push({
      ...line,
      quantity
    });
    return acc;
  }, input);

  updated.lines = readings.lines;
  set(updated, 'meters[0].startReading', formValues.startReading);
  return set(updated, 'meters[0].readings', omit(formValues, ['csrf_token', 'startReading']));
};

const applyMeterReset = (data, formValues) => {
  const { meterReset } = formValues;
  const updated = cloneDeep(data);

  if (meterReset) {
    set(updated, 'reading.method', 'abstractionVolumes');
    const meters = updated.meters || [];
    for (let meter of meters) {
      delete meter.readings;
      delete meter.startReading;
      delete meter.units;
    }
  }

  return updated;
};

const getIsUnderQuery = value => {
  if (isArray(value)) {
    return value.includes('under_query');
  }
  if (isBoolean(value)) {
    return value;
  }
  throw new Error('Expected array or boolean value');
};

/**
 * Applies under query
 * @param {Object} data - current return model data
 * @param {Object} formValues - data collected from form
 * @param {Boolean} formValues.isUnderQuery
 * @return {Object} new return model state
 */
const applyUnderQuery = (data, formValues) => {
  const updated = cloneDeep(data);
  const { isUnderQuery } = formValues;
  updated.isUnderQuery = getIsUnderQuery(isUnderQuery);
  return updated;
};

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

module.exports = {
  applySingleTotal,
  isDateWithinAbstractionPeriod,
  applyBasis,
  applyQuantities,
  applyUserDetails,
  applyNilReturn,
  getFormLines,
  applyStatus,
  applyExternalUser,
  applyMeterDetails,
  applyMeterUnits,
  getLineLabel,
  getLineName,
  getLineValues,
  applyMeterReadings,
  applyMeterReset,
  applyMethod,
  getMeter,
  getLinesWithReadings,
  applyUnderQuery
};
