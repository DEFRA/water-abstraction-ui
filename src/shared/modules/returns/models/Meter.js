const Joi = require('joi');
const { pick, findLastKey } = require('lodash');

const { mapMeterLinesToVolumes } = require('./water-return-helpers');

const mapReadingsArrayToObject = arr => arr.reduce((acc, row) => ({
  ...acc,
  [`${row.startDate}_${row.endDate}`]: row.reading
}), {});

class Meter {
  constructor (reading, lines, meter = {}) {
    this.reading = reading;
    this.meterDetailsProvided = meter.meterDetailsProvided;
    this.manufacturer = meter.manufacturer;
    this.serialNumber = meter.serialNumber;
    this.startReading = meter.startReading;
    this.multiplier = meter.multiplier || 1;
    this.readings = meter.readings || {};
    this.lines = lines;
  }

  toObject () {
    const obj = pick(this,
      ['meterDetailsProvided', 'manufacturer', 'serialNumber', 'multiplier']
    );
    if (this.reading.isOneMeter()) {
      Object.assign(obj, {
        startReading: this.startReading,
        readings: this.readings,
        units: this.reading.getUnits()
      });
    }
    return obj;
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
    Object.assign(this, value);
    return this;
  }

  /**
   * Sets meter readings
   * @param {Number} startReading - the start reading
   * @param {Array} readings
   */
  setMeterReadings (startReading, readings) {
    Joi.assert(startReading, Joi.number().positive());
    const schema = Joi.array().items({
      startDate: Joi.string().isoDate(),
      endDate: Joi.string().isoDate(),
      reading: Joi.number().min(0).allow(null)
    });
    Joi.assert(readings, schema);

    // Set meter readings
    this.startReading = startReading;
    this.readings = mapReadingsArrayToObject(readings);

    return this;
  }

  getStartReading () {
    return this.startReading;
  }

  getEndReading () {
    const key = findLastKey(this.readings, reading => reading > 0);
    return this.readings[key];
  }

  getMultiplier () {
    return this.multiplier;
  }

  getVolumes (includeReadings = false) {
    const lines = this.lines.toArray();
    return mapMeterLinesToVolumes(this.startReading, this.readings, lines, this.multiplier, includeReadings);
  }

  isMeterDetailsProvided () {
    return this.meterDetailsProvided === true;
  }
};

module.exports = Meter;
