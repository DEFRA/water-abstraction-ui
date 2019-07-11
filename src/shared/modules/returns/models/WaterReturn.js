const moment = require('moment');
const Joi = require('joi');
const { get, set, find, pick } = require('lodash');
const { getDay, getMonth } = require('./return-date-helpers');
const { createLines, getDefaultQuantity, mapMeterLinesToVolumes } = require('./water-return-helpers');

const METHOD_VOLUMES = 'abstractionVolumes';
const METHOD_ONE_METER = 'oneMeter';
const READING_TYPE_ESTIMATED = 'estimated';
const READING_TYPE_MEASURED = 'measured';
const USER_TYPE_INTERNAL = 'internal';
const USER_TYPE_EXTERNAL = 'external';
const STATUS_DUE = 'due';
const STATUS_RECEIVED = 'received';
const STATUS_COMPLETED = 'completed';

class WaterReturn {
  constructor (data) {
    this.returnId = data.returnId;
    this.licenceNumber = data.licenceNumber;
    this.receivedDate = data.receivedDate;
    this.versionNumber = data.versionNumber;
    this.isCurrent = data.isCurrent;
    this.status = data.status;
    this.isNil = data.isNil;
    this.meters = data.meters;
    this.reading = data.reading;
    this.lines = createLines(data);
    this.metadata = data.metadata;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.frequency = data.frequency;
    this.user = data.user;
  }

  toObject () {
    this.cleanup();
    return {
      returnId: this.returnId,
      licenceNumber: this.licenceNumber,
      receivedDate: this.receivedDate,
      versionNumber: this.versionNumber,
      isCurrent: this.isCurrent,
      status: this.status,
      isNil: this.isNil,
      meters: this.meters,
      reading: this.reading,
      lines: this.lines,
      metadata: this.metadata,
      startDate: this.startDate,
      endDate: this.endDate,
      frequency: this.frequency,
      user: this.user
    };
  }

  cleanup () {
    if (this.isVolumes()) {
      this.meters = this.meters.map(meter => {
        delete meter.startReading;
        delete meter.readings;
        delete meter.units;
        return meter;
      });
    }
    if (this.isNilReturn()) {
      delete this.lines;
      delete this.meters;
      delete this.reading;
    }
  }

  setNilReturn (isNil) {
    Joi.assert(isNil, Joi.boolean());
    this.isNil = isNil;
    return this;
  }

  /**
   * Reading type
   * @param {String} type - estimated|measured
   */
  setReadingType (type) {
    Joi.assert(type, Joi.string().valid([READING_TYPE_ESTIMATED, READING_TYPE_MEASURED]));
    set(this, 'reading.type', type);
    set(this, 'reading.totalFlag', false);
    if (type === READING_TYPE_ESTIMATED) {
      this.meters = [];
    }
    return this;
  }

  /**
   * Sets whether method for return is abstraction volumes or readings from one
   * meter
   * @param {String} method - abstractionVolumes|oneMeter
   */
  setMethod (method) {
    Joi.assert(method, Joi.string().valid([METHOD_VOLUMES, METHOD_ONE_METER]));
    set(this, 'reading.method', method);

    if (method === METHOD_ONE_METER) {
      set(this, 'reading.totalFlag', false);
      return this.setReadingType(READING_TYPE_MEASURED);
    }

    if (method === METHOD_VOLUMES) {
      this.meters = this.meters || [];
      for (let meter of this.meters) {
        delete meter.readings;
        delete meter.startReading;
        delete meter.units;
      }
    }

    return this;
  }

  /**
   * Sets the units of water used
   * @param {String} units - m³|l|Ml|gal
   */
  setUnits (units) {
    Joi.assert(units, Joi.string().valid(['m³', 'l', 'Ml', 'gal']));
    this.meters = this.meters.map(meter => ({
      ...meter,
      units
    }));
    set(this, 'reading.units', units);
    return this;
  };

  /**
   * Sets lines data
   * @param {String} startDate - the start date for the return line
   * @param {String} endDate - the end date for the return line
   * @param {Number|null} quantity - abstracted volume or null
   */
  setLines (lines) {
    const schema = Joi.array().items({
      startDate: Joi.string().isoDate(),
      endDate: Joi.string().isoDate(),
      quantity: Joi.number().min(0).allow(null)
    });
    Joi.assert(lines, schema);

    const abstractionPeriod = this.getAbstractionPeriod();

    this.lines.forEach(line => {
      const { startDate, endDate } = line;
      const updatedLine = find(lines, { startDate, endDate });
      if (!updatedLine) {
        throw new Error(`Return ${this.returnId} missing line ${startDate} - ${endDate}`);
      }
      const defaultValue = getDefaultQuantity(line, abstractionPeriod);
      line.quantity = updatedLine.quantity || defaultValue;
    });

    return this;
  }

  /**
   * Sets meter readings
   * @param {Number} startReading - the start reading
   * @param {Array} readings
   */
  setMeterReadings (startReading, readings) {
    console.log('startReading', startReading);
    console.log('readings', readings);

    Joi.assert(startReading, Joi.number().positive());
    const schema = Joi.array().items({
      startDate: Joi.string().isoDate(),
      endDate: Joi.string().isoDate(),
      reading: Joi.number().min(0).allow(null)
    });
    Joi.assert(readings, schema);

    // Calculate volume lines
    const lines = mapMeterLinesToVolumes(startReading, readings);
    this.setLines(lines);

    // Set meter readings
    const meterReadings = readings.reduce((acc, row) => ({
      ...acc,
      [`${row.startDate}_${row.endDate}`]: row.reading
    }), {});
    set(this, 'meters[0].startReading', startReading);
    set(this, 'meters[0].readings', meterReadings);
    return this;
  }

  /**
   * Sets meter details
   * @param {Object} meter - the meter
   */
  setMeterDetails (meter) {
    const schema = {
      manufacturer: Joi.string().required(),
      serialNumber: Joi.string().required(),
      multiplier: Joi.number().positive(),
      meterDetailsProvided: Joi.boolean().default(true)
    };
    const { value, error } = Joi.validate(meter, schema);
    if (error) {
      throw new Error(`Invalid meter details`, meter);
    }
    const current = get(this, 'meters[0]', {});
    this.meters = [Object.assign(current, value)];
    return this;
  }

  setUser (email, entityId, isInternal) {
    Joi.assert(email, Joi.string().email());
    Joi.assert(entityId, Joi.string().guid());
    Joi.assert(isInternal, Joi.boolean());

    this.user = {
      email,
      entityId,
      type: isInternal ? USER_TYPE_INTERNAL : USER_TYPE_EXTERNAL
    };
    return this;
  }

  /**
   * Applys received date and completed status to return
   * @param {String} [status] - status to set to, defaults to 'completed'
   * @param {String} [receivedDate] - ISO 8601 date string, YYYY-MM-DD
   * @return {Object} updated return data model
   */
  setStatus (status, receivedDate) {
    const date = receivedDate || moment().format('YYYY-MM-DD');
    Joi.assert(status, Joi.string().valid([STATUS_DUE, STATUS_RECEIVED, STATUS_COMPLETED]));

    if (!this.receivedDate) {
      this.receivedDate = date;
    }

    // Don't allow a completed return to go back to an earlier status
    if (this.status !== STATUS_COMPLETED) {
      this.status = status;
    }
    return this;
  };

  /**
   * Applies the multiplication to the return lines if the return is not a nil
   * return, and the method is oneMeter
   */
  applyMeterMultiplication () {
    if (!this.isNilReturn() && this.isOneMeter()) {
      const multiplier = parseFloat(get(this, 'meters[0].multiplier'));
      this.lines = this.lines.map(row => ({
        ...row,
        quantity: row.quantity * multiplier
      }));
    }
    return this;
  };

  incrementVersionNumber () {
    this.versionNumber = parseInt(this.versionNumber || 0) + 1;
    this.isCurrent = true;
    return this;
  }

  /**
   * Gets return lines including meter readings if present
   * @return {Array}
   */
  getLinesWithReadings () {
    if (this.isNilReturn()) {
      return;
    }

    if (this.isVolumes()) {
      return this.lines;
    }

    let previousReading = get(this, 'meters[0].startReading');

    const lines = this.lines.map(row => {
      if (row.quantity === null) {
        return row;
      }

      const readingKey = `${row.startDate}_${row.endDate}`;
      const reading = get(this, `meters[0].readings.${readingKey}`);

      const newRow = {
        ...row,
        startReading: previousReading,
        endReading: reading
      };

      previousReading = reading || previousReading;

      return newRow;
    });
    return lines;
  };

  /**
   * Gets the abstraction period start day/month and end day/month
   * Usually this is retrieved from the metadata object.
   * However internal users can set a custom abstraction period in which
   * case this is returned instead
   * @return {Object} - abstraction period details
   */
  getAbstractionPeriod () {
    const isCustomPeriod = get(this, 'reading.totalCustomDates', false);
    if (isCustomPeriod) {
      const { totalCustomDateStart, totalCustomDateEnd } = this.reading;
      return {
        periodStartDay: getDay(totalCustomDateStart),
        periodStartMonth: getMonth(totalCustomDateStart),
        periodEndDay: getDay(totalCustomDateEnd),
        periodEndMonth: getMonth(totalCustomDateEnd)
      };
    }
    return pick(
      this.metadata.nald,
      'periodEndDay',
      'periodEndMonth',
      'periodStartDay',
      'periodStartMonth'
    );
  }

  isMeterDetailsProvided () {
    return get(this, 'meters[0].meterDetailsProvided', false);
  }

  isVolumes () {
    return get(this, 'reading.method') === METHOD_VOLUMES;
  }

  isOneMeter () {
    return get(this, 'reading.method') === METHOD_ONE_METER;
  }

  isNilReturn () {
    return this.isNil;
  }

  isSingleTotal () {
    return get(this, 'reading.totalFlag', false);
  }

  isMeasured () {
    return get(this, 'reading.type') === READING_TYPE_MEASURED;
  }
}

module.exports = WaterReturn;
module.exports.METHOD_VOLUMES = METHOD_VOLUMES;
module.exports.METHOD_ONE_METER = METHOD_ONE_METER;
module.exports.STATUS_COMPLETED = STATUS_COMPLETED;
