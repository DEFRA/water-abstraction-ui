const Boom = require('boom');
const { get, omit, cloneDeep, set, mapValues } = require('lodash');
const moment = require('moment');
const { maxPrecision } = require('../../../lib/number-formatter');

/**
 * Checks whether a supplied day/month is the same or after a reference day/month
 * @param {Number} day - the day to test
 * @param {Number} month - the month to test
 * @param {Number} refDay - the reference day
 * @param {Number} refMonth - the reference month
 * @return {Boolean}
 */
const isSameOrAfter = (day, month, refDay, refMonth) => {
  if (month > refMonth) {
    return true;
  }
  return ((month === refMonth) && (day >= refDay));
};

/**
 * Checks whether a supplied day/month is the same or before a reference day/month
 * @param {Number} day - the day to test
 * @param {Number} month - the month to test
 * @param {Number} refDay - the reference day
 * @param {Number} refMonth - the reference month
 * @return {Boolean}
 */
const isSameOrBefore = (day, month, refDay, refMonth) => {
  if (month < refMonth) {
    return true;
  }
  return (month === refMonth) && (day <= refDay);
};

/**
 * Checks whether the specified date is within the abstraction period
 * @param {String} date - the date to test, format YYYY-MM-DD
 * @param {Object} options - abstraction period
 * @param {Number} options.periodStartDay - abstraction period start day of the month
 * @param {Number} options.periodStartMonth - abstraction period start month
 * @param {Number} options.periodEndDay - abstraction period end day of the month
 * @param {Number} options.periodEndMonth - abstraction period end month
 * @return {Boolean} whether supplied date is within abstraction period
 */
const isDateWithinAbstractionPeriod = (date, options) => {
  const {
    periodEndDay,
    periodEndMonth,
    periodStartDay,
    periodStartMonth
  } = options;

  // Month and day of test date
  const month = moment(date).month() + 1;
  const day = moment(date).date();

  // Period start date is >= period end date
  if (isSameOrAfter(periodEndDay, periodEndMonth, periodStartDay, periodStartMonth)) {
    return isSameOrAfter(day, month, periodStartDay, periodStartMonth) &&
      isSameOrBefore(day, month, periodEndDay, periodEndMonth);
  } else {
    const prevYear = isSameOrAfter(day, month, 1, 1) &&
     isSameOrBefore(day, month, periodEndDay, periodEndMonth);

    const thisYear = isSameOrAfter(day, month, periodStartDay, periodStartMonth) &&
     isSameOrBefore(day, month, 31, 12);

    return prevYear || thisYear;
  }
};

/**
 * Gets period start/end from NALD metadata in return,
 * and converts to integers
 * @param {Object} data
 * @return {Object} only contains period start/end data as integers
 */
const getPeriodStartEnd = (data) => {
  // Get period start/end and convert to integers
  const {
    periodEndDay,
    periodEndMonth,
    periodStartDay,
    periodStartMonth
  } = data.metadata.nald;

  return mapValues({
    periodEndDay,
    periodEndMonth,
    periodStartDay,
    periodStartMonth
  }, parseInt);
};

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
      if (isDateWithinAbstractionPeriod(line.startDate, options) || isDateWithinAbstractionPeriod(line.endDate, options)) {
        acc.push(index);
      }
      return acc;
    }, []);

    const perMonth = total / indexes.length;

    d.lines = lines.map((line, i) => {
      return {
        ...line,
        quantity: indexes.includes(i) ? perMonth : 0
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
 * @param {String} - abstractionVolumes | oneMeter
 * @return {Object} - updated return model
 */
const applyMethod = (data, method) => {
  const d = cloneDeep(data);

  set(d, 'reading.method', method);

  if (method === 'abstractionVolumes') {
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

  const lines = getFormLines(f);

  f.lines = lines.map(line => {
    const name = line.startDate + '_' + line.endDate;
    return {
      ...line,
      quantity: formValues[name]
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
 * @return {Object} updated return data model
 */
const applyStatus = (data, status = 'completed') => {
  if (!['completed', 'due', 'received'].includes(status)) {
    throw Boom.badImplementation(`Invalid return status ${status}`);
  }
  const d = cloneDeep(data);
  if (!d.receivedDate) {
    d.receivedDate = moment().format('YYYY-MM-DD');
  }
  d.status = status;
  return d;
};

const applyMeterDetails = (data, formValues) => {
  const clone = cloneDeep(data);
  const details = {
    manufacturer: formValues.manufacturer,
    serialNumber: formValues.serialNumber,
    startReading: formValues.startReading,
    multiplier: formValues.isMultiplier ? 10 : 1
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

const applyMeterReadings = (data, formValues) => {
  const updated = cloneDeep(data);
  const lines = getFormLines(updated);
  const { startReading, multiplier = 1 } = data.meters[0];

  const input = {
    lines: [],
    lastMeterReading: startReading
  };

  const readings = lines.reduce((acc, line) => {
    // get the meter reading, or set to null if zero or null
    const meterReading = formValues[getLineName(line)] || null;
    let quantity = null;

    if (meterReading) {
      // get the quantity and multiply. Set to null for zero.
      quantity = ((meterReading - acc.lastMeterReading) * multiplier) || null;
      acc.lastMeterReading = meterReading;
    }

    acc.lines.push({
      ...line,
      quantity
    });
    return acc;
  }, input);

  updated.lines = readings.lines;
  return set(updated, 'meters[0].readings', omit(formValues, 'csrf_token'));
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
  applyMethod,
  getMeter
};
