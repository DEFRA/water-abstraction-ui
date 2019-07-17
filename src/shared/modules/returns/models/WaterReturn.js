const moment = require('moment');
const Joi = require('joi');
const { get, pick } = require('lodash');
const { getDay, getMonth } = require('./return-date-helpers');
const { getReturnTotal } = require('./water-return-helpers');

const Reading = require('./reading');
const Meter = require('./meter');
const Lines = require('./lines');

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

    const lineOptions = pick(data, ['startDate', 'endDate', 'frequency']);
    this.lines = new Lines(data.lines, lineOptions);
    this.metadata = data.metadata;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.frequency = data.frequency;
    this.user = data.user;
    this.versions = data.versions;
    this.reading = new Reading(data.reading);
    this.meter = new Meter(this.reading, this.lines, data.meters[0]);
  }

  toObject () {
    const obj = {
      returnId: this.returnId,
      licenceNumber: this.licenceNumber,
      receivedDate: this.receivedDate,
      versionNumber: this.versionNumber,
      isCurrent: this.isCurrent,
      status: this.status,
      isNil: this.isNil,
      meters: [this.meter.toObject()],
      reading: this.reading.toObject(),
      metadata: this.metadata,
      startDate: this.startDate,
      endDate: this.endDate,
      frequency: this.frequency,
      user: this.user,
      versions: this.versions
    };

    if (!this.isNilReturn()) {
      Object.assign(obj, {
        lines: this.getLines(),
        meters: [this.meter.toObject()],
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
}

module.exports = WaterReturn;
module.exports.STATUS_COMPLETED = STATUS_COMPLETED;
