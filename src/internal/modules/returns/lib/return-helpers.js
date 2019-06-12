const Boom = require('boom');
const { get, omit, cloneDeep, set, isArray, isBoolean } = require('lodash');
const moment = require('moment');
const { maxPrecision } = require('../../../../shared/lib/number-formatter');
const { getPeriodStartEnd, isDateWithinAbstractionPeriod } = require('./return-date-helpers');
const permissions = require('../../../lib/permissions');

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

const applySingleTotal = (data, formData) => {
  const updatedReturnData = cloneDeep(data);
  const { isSingleTotal, total } = formData;

  updatedReturnData.reading.totalFlag = isSingleTotal;
  updatedReturnData.reading.total = isSingleTotal ? total : undefined;
  return updatedReturnData;
};

const applySingleTotalAbstractionDates = (data, formValues) => {
  const { totalCustomDates, totalCustomDateStart, totalCustomDateEnd } = formValues;
  const clone = cloneDeep(data);

  clone.reading = Object.assign({}, clone.reading, {
    totalCustomDates,
    totalCustomDateStart: totalCustomDates ? isoDateAndTimeToIsoDate(totalCustomDateStart) : null,
    totalCustomDateEnd: totalCustomDates ? isoDateAndTimeToIsoDate(totalCustomDateEnd) : null
  });

  // Get period start/end and convert to integers
  const options = getPeriodStartEnd(clone);
  const lines = getFormLines(clone);

  // Find which return lines are within abstraction period
  if (lines) {
    const indexes = lines.reduce((acc, line, index) => {
      if (isDateWithinAbstractionPeriod(line.endDate, options)) {
        acc.push(index);
      }
      return acc;
    }, []);

    const perMonth = clone.reading.total / indexes.length;

    clone.lines = lines.map((line, i) => {
      return {
        ...line,
        quantity: indexes.includes(i) ? perMonth : null
      };
    });
  }

  return clone;
};

/**
 * Applies the method of return - either volumes or meter readings
 * @param {Object} - return model
 * @param {String} - reading method
 * @return {Object} - updated return model
 */
const applyMethod = (data, readingMethod) => {
  const applied = set(cloneDeep(data), 'reading.method', readingMethod);

  if (readingMethod === 'oneMeter') {
    set(applied, 'reading.totalFlag', false);
    return applyReadingType(applied, 'measured');
  }

  if (readingMethod === 'abstractionVolumes') {
    const meters = applied.meters || [];
    for (let meter of meters) {
      delete meter.readings;
      delete meter.startReading;
      delete meter.units;
    }
  }

  return applied;
};

/**
 * Applies the reading type
 * @param  {Object} data        - return model data
 * @param  {String} readingType - can be estimated|measured
 * @return {Object}             - updated return model
 */
const applyReadingType = (data, readingType) => {
  return set(cloneDeep(data), 'reading.type', readingType);
};

/**
 * For external returns, both reading method and type are set at the
 * same time with a comma separated string
 * @param  {Object} data   - return model
 * @param  {String} method - readingMethod,readingType
 * @return {Object}        - updated return model
 */
const applyMethodExternal = (data, method) => {
  const [readingMethod, readingType] = method.split(',');
  return applyReadingType(applyMethod(data, readingMethod), readingType);
};

/**
 * Returns form lines
 * @param {Object} returns data model
 * @return {Array} returns lines if set and not empty, otherwise required lines
 */
const getFormLines = (data) => {
  return data.lines && data.lines.length ? data.lines : data.requiredLines;
};

/**
 * Returns a clone of the first meter if present, or an empty object otherwise
 * @param  {Object} data - return model
 * @return {Object}      - meter object or empty object
 */
const getMeter = data => {
  const clone = cloneDeep(data);
  return get(clone, 'meters[0]', {});
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
 * @param {Object} request - hapi request
 * @return {Object} returns model with user data added
 */
const applyUserDetails = (data, request) => {
  const d = cloneDeep(data);
  const { userName, userScopes, entityId } = request.defra;
  return {
    ...d,
    user: {
      email: userName,
      type: userScopes.includes('internal') ? 'internal' : 'external',
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
 * Converts a full ISO 8601 date and time to just the date part in the ISO format
 * e.g. 2019-01-01T01:01:01+00:00 becomes 2019-01-01
 */
const isoDateAndTimeToIsoDate = dateAndTime => moment(dateAndTime).format('YYYY-MM-DD');

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
    multiplier,
    meterDetailsProvided: true
  };

  const meter = Object.assign(getMeter(data), details);
  return set(clone, 'meters', [meter]);
};

const applyMeterDetailsProvided = (data, formValues) => {
  const clone = cloneDeep(data);
  const { meterDetailsProvided } = formValues;
  const meter = meterDetailsProvided === true ? getMeter(data) : {};
  meter.meterDetailsProvided = meterDetailsProvided;
  meter.multiplier = meter.multiplier || 1;

  // If meter details have been provided, then we must be using measured
  if (meterDetailsProvided) {
    set(clone, 'reading.type', 'measured');
  }

  return set(clone, 'meters', [meter]);
};

const applyMeterUnits = (data, formValues) => {
  const { units } = formValues;
  if (['m³', 'l', 'Ml', 'gal'].includes(units)) {
    const clone = applyReadingType(data, 'measured');
    set(clone, 'meters[0].units', units);
    return set(clone, 'reading.units', units);
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
      quantity = (meterReading - acc.lastMeterReading);
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
    return set(updated, 'reading.method', 'abstractionVolumes');
  }

  return set(updated, 'reading.method', 'oneMeter');
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

const isEstimatedReading = data => get(data, 'reading.type') === 'estimated';

const checkMeterDetails = data => {
  return isEstimatedReading(data) ? set(cloneDeep(data), 'meters', []) : data;
};

/**
 * Applies the recieved date
 * @param {Object} data - current return model data
 * @param {Object} formValues - data collected from form
 * @return {Object} new return model state
 */
const applyReceivedDate = (data, formValues) => {
  return Object.assign(cloneDeep(data), { receivedDate: formValues.receivedDate });
};

/**
 * Applies the multiplication to the return lines if the return is not a nil
 * return, and the method is oneMeter
 * @param  {Object} data - return model
 * @return {Object}      - return model with multiplication applied
 */
const applyMultiplication = (data) => {
  const updated = cloneDeep(data);

  // For meter readings, apply x10 to volumes
  const isNil = get(updated, 'isNil');
  const isMeter = get(updated, 'reading.method') === 'oneMeter';
  if (!isNil && isMeter) {
    const multiplier = parseFloat(get(updated, 'meters[0].multiplier'));
    updated.lines = updated.lines.map(row => ({
      ...row,
      quantity: row.quantity * multiplier
    }));
  }
  return updated;
};

/**
 * Tidies data ready for submission
 * @param  {Object} data    - return data model
 * @param  {Object} request - HAPI request
 * @return {Object}         ready for submission
 */
const applyCleanup = (data, request) => {
  let updated = cloneDeep(data);

  const isExternal = permissions.isExternal(request);

  if (isExternal) {
    // External users can't submit single total value
    set(updated, 'reading.totalFlag', false);
    // External users must provide meter details for all meters
    if (updated.meters) {
      updated.meters = updated.meters.map(row => {
        return {
          ...row,
          meterDetailsProvided: true
        };
      });
    }
    // Delete startReading and meter readings if submitting abstractionVolumes
    if (get(updated, 'reading.method') === 'abstractionVolumes') {
      updated.meters = updated.meters.map(meter => {
        delete meter.startReading;
        delete meter.readings;
        return meter;
      });
    }
  }

  // Apply meter multiplication
  updated = applyMultiplication(updated);

  // Required lines and versions shouldn't be posted back to water service
  delete updated.requiredLines;
  delete updated.versions;

  return updated;
};

module.exports = {
  applyExternalUser,
  applyMeterDetailsProvided,
  applyMeterDetails,
  applyMeterReadings,
  applyMeterReset,
  applyMeterUnits,
  applyMethod,
  applyMethodExternal,
  applyNilReturn,
  applyQuantities,
  applyReadingType,
  applyReceivedDate,
  applySingleTotal,
  applySingleTotalAbstractionDates,
  applyStatus,
  applyUnderQuery,
  applyUserDetails,
  applyMultiplication,
  applyCleanup,

  checkMeterDetails,

  getFormLines,
  getLineLabel,
  getLineName,
  getLineValues,
  getLinesWithReadings,
  getMeter,

  isDateWithinAbstractionPeriod
};
