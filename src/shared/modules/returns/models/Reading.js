const Joi = require('joi');
const { pick } = require('lodash');
const METHOD_VOLUMES = 'abstractionVolumes';
const METHOD_ONE_METER = 'oneMeter';
const READING_TYPE_ESTIMATED = 'estimated';
const READING_TYPE_MEASURED = 'measured';

class Reading {
  constructor (reading) {
    this.type = reading.type;
    this.method = reading.method;
    this.units = reading.units;
    this.totalFlag = reading.totalFlag;
    this.total = reading.total;
    this.totalCustomDates = reading.totalCustomDates;
    this.totalCustomDateStart = reading.totalCustomDateStart;
    this.totalCustomDateEnd = reading.totalCustomDateEnd;
  }

  toObject () {
    const keys = ['type', 'method', 'units', 'totalFlag'];

    if (this.totalFlag) {
      keys.push('total', 'totalCustomDates');
    }

    if (this.totalFlag && this.totalCustomDates) {
      keys.push('totalCustomDateStart', 'totalCustomDateEnd');
    }

    return pick(this, keys);
  }

  /**
   * Reading type
   * @param {String} type - estimated|measured
   */
  setReadingType (type) {
    Joi.assert(type, Joi.string().valid([READING_TYPE_ESTIMATED, READING_TYPE_MEASURED]));
    this.type = type;
    this.totalFlag = false;
    return this;
  }

  /**
   * Sets whether method for return is abstraction volumes or readings from one
   * meter
   * @param {String} method - abstractionVolumes|oneMeter
   */
  setMethod (method) {
    Joi.assert(method, Joi.string().valid([METHOD_VOLUMES, METHOD_ONE_METER]));
    this.method = method;
    if (method === METHOD_ONE_METER) {
      this.totalFlag = false;
      return this.setReadingType(READING_TYPE_MEASURED);
    }
    return this;
  }

  /**
   * Sets the units of water used
   * @param {String} units - m³|l|Ml|gal
   */
  setUnits (units) {
    Joi.assert(units, Joi.string().valid(['m³', 'l', 'Ml', 'gal']));
    this.units = units;
    return this;
  };

  getUnits () {
    return this.units;
  }

  isVolumes () {
    return this.method === METHOD_VOLUMES;
  }

  isOneMeter () {
    return this.method === METHOD_ONE_METER;
  }

  isSingleTotal () {
    return this.totalFlag === true;
  }

  isMeasured () {
    return this.type === READING_TYPE_MEASURED;
  }
}

module.exports = Reading;
module.exports.METHOD_VOLUMES = METHOD_VOLUMES;
module.exports.METHOD_ONE_METER = METHOD_ONE_METER;
module.exports.READING_TYPE_ESTIMATED = READING_TYPE_ESTIMATED;
module.exports.READING_TYPE_MEASURED = READING_TYPE_MEASURED;
