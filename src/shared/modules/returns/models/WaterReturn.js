const moment = require('moment');
const Joi = require('@hapi/joi');
const { get, pick, mapValues } = require('lodash');
const { getDay, getMonth } = require('./return-date-helpers');
const { getReturnTotal } = require('./water-return-helpers');

const Reading = require('./Reading');
const Meter = require('./Meter');
const Lines = require('./Lines');

const USER_TYPE_INTERNAL = 'internal';
const USER_TYPE_EXTERNAL = 'external';
const STATUS_DUE = 'due';
const STATUS_RECEIVED = 'received';
const STATUS_COMPLETED = 'completed';

const toObjectKeys = ['returnId', 'licenceNumber', 'receivedDate',
  'versionNumber', 'isCurrent', 'status', 'isNil', 'metadata', 'startDate',
  'endDate', 'frequency', 'user', 'versions', 'isUnderQuery'];

class WaterReturn {
  constructor (data = {}) {
    this.returnId = data.returnId;
    this.licenceNumber = data.licenceNumber;
    this.receivedDate = data.receivedDate;
    this.versionNumber = data.versionNumber;
    this.isCurrent = data.isCurrent;
    this.status = data.status;
    this.isNil = data.isNil;

    const lineOptions = pick(data, ['startDate', 'endDate', 'frequency']);
    this.lines = new Lines(data.lines, { ...lineOptions, isFinal: data.metadata.isFinal });
    this.metadata = data.metadata;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.frequency = data.frequency;
    this.user = data.user;
    this.versions = data.versions;
    this.reading = new Reading(data.reading);
    const meterData = get(data, 'meters[0]', {});
    this.meter = new Meter(this.reading, this.lines, meterData);
    this.isUnderQuery = data.isUnderQuery;
  }

  toObject () {
    const obj = pick(this, toObjectKeys);

    if (!this.isNilReturn()) {
      const meters = this.reading.isMeasured() ? [this.meter.toObject()] : [];

      Object.assign(obj, {
        lines: this.getLines(),
        meters,
        reading: this.reading.toObject()
      });
    }

    return obj;
  }

  setNilReturn (isNil) {
    Joi.assert(isNil, Joi.boolean());
    this.isNil = isNil;
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
   * @return {Object} updated return data model
   */
  setStatus (status) {
    Joi.assert(status, Joi.string().valid([STATUS_DUE, STATUS_RECEIVED, STATUS_COMPLETED]));

    // Don't allow a completed return to go back to an earlier status
    if (this.status !== STATUS_COMPLETED) {
      this.status = status;
    }
    return this;
  };

  /**
   * Sets the date on which the return was received
   * @param {String} date - ISO 8601 date field
   */
  setReceivedDate (receivedDate) {
    const date = receivedDate || moment().format('YYYY-MM-DD');
    Joi.assert(date, Joi.string().isoDate());
    this.receivedDate = date;
    return this;
  }

  setLines (lines) {
    const abstractionPeriod = this.getAbstractionPeriod();
    return this.lines.setLines(abstractionPeriod, lines);
  }

  /**
   * Gets lines data from either meters or lines object depending on
   * whether reading type is oneMeter / abstractionVolumes
   * @param  {Boolean} [includeReadings=false] - whether to include meter readings in lines
   * @return {Array}                           - lines array
   */
  getLines (includeReadings = false) {
    if (this.isNilReturn()) {
      return;
    }
    if (this.reading.isOneMeter()) {
      return this.meter.getVolumes(includeReadings);
    }
    // Volumes
    return this.lines.toArray();
  }

  /**
   * Applies the single total value using the default/custom abstraction period
   * @return {[type]} [description]
   */
  updateSingleTotalLines () {
    const total = this.reading.getSingleTotal();
    const abstractionPeriod = this.getAbstractionPeriod();
    this.lines.setSingleTotal(abstractionPeriod, total);
    return this;
  }

  incrementVersionNumber () {
    this.versionNumber = parseInt(this.versionNumber || 0) + 1;
    this.isCurrent = true;
    return this;
  }

  /**
   * Gets the abstraction period start day/month and end day/month
   * Usually this is retrieved from the metadata object.
   * However internal users can set a custom abstraction period in which
   * case this is returned instead
   * @return {Object} - abstraction period details
   */
  getAbstractionPeriod () {
    const isCustomPeriod = get(this, 'reading.totalCustomDates', false);
    let data;
    if (isCustomPeriod) {
      const { totalCustomDateStart, totalCustomDateEnd } = this.reading;
      data = {
        periodStartDay: getDay(totalCustomDateStart),
        periodStartMonth: getMonth(totalCustomDateStart),
        periodEndDay: getDay(totalCustomDateEnd),
        periodEndMonth: getMonth(totalCustomDateEnd)
      };
    } else {
      data = pick(
        this.metadata.nald,
        'periodEndDay',
        'periodEndMonth',
        'periodStartDay',
        'periodStartMonth'
      );
    }
    return mapValues(data, parseInt);
  }

  /**
   * Gets total abstracted volume, or null
   * @return {Number|null} - total abstracted volume
   */
  getReturnTotal () {
    const lines = this.getLines();
    return getReturnTotal(lines);
  }

  isNilReturn () {
    return this.isNil;
  }

  setUnderQuery (underQuery) {
    Joi.assert(underQuery, Joi.boolean());
    this.isUnderQuery = underQuery;
    return this;
  }
}

module.exports = WaterReturn;
module.exports.STATUS_COMPLETED = STATUS_COMPLETED;
module.exports.STATUS_RECEIVED = STATUS_RECEIVED;
