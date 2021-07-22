const { find, xor } = require('lodash');
const Joi = require('joi');
const { returns: { lines: { getRequiredLines } } } = require('@envage/water-abstraction-helpers');
const { getDefaultQuantity, getSingleTotalLines } = require('./water-return-helpers');

const {
  VALID_DATE, VALID_QUANTITY, VALID_PERIOD,
  VALID_READING_TYPE, VALID_ABSTRACTION_PERIOD, VALID_FLAG
} = require('./validators');

const linesSchema = Joi.array().items({
  startDate: VALID_DATE,
  endDate: VALID_DATE,
  quantity: VALID_QUANTITY,
  timePeriod: VALID_PERIOD,
  readingType: VALID_READING_TYPE
});

const optionsSchema = Joi.object({
  startDate: VALID_DATE,
  endDate: VALID_DATE,
  frequency: VALID_PERIOD,
  isFinal: VALID_FLAG
});

const getDateKey = line => `${line.startDate}_${line.endDate}`;

const getDateKeys = lines => lines.map(getDateKey);

const getInitialLines = (lines = [], options) => {
  const { startDate, endDate, frequency, isFinal } = options;

  // Create the required lines defined by the return header data
  const requiredLines = getRequiredLines(startDate, endDate, frequency, isFinal);

  // Index supplied lines by date range
  const map = lines.reduce((acc, line) =>
    acc.set(getDateKey(line), line)
  , new Map());

  // Use existing lines if correct date range
  return requiredLines.reduce((acc, requiredLine) => {
    const key = getDateKey(requiredLine);
    return [
      ...acc,
      map.has(key) ? map.get(key) : requiredLine
    ];
  }, []);
};

class Lines {
  constructor (lines = [], options = {}) {
    Joi.assert(lines, linesSchema);
    Joi.assert(options, optionsSchema);
    this.lines = getInitialLines(lines, options);
  }

  toArray () {
    return this.lines;
  }

  /**
   * Sets lines data
   * @param {Object} abstractionPeriod
   * @param {Array} lines
   * @param {String} lines[].startDate - the start date for the return line
   * @param {String} lines[].endDate - the end date for the return line
   * @param {Number|null} lines[].quantity - abstracted volume or null
   */
  setLines (abstractionPeriod, lines) {
    const schema = Joi.array().items({
      startDate: Joi.string().isoDate(),
      endDate: Joi.string().isoDate(),
      quantity: Joi.number().min(0).allow(null)
    });
    Joi.assert(lines, schema);
    Joi.assert(abstractionPeriod, VALID_ABSTRACTION_PERIOD);

    // Check both arrays have same date keys
    if (xor(getDateKeys(this.lines), getDateKeys(lines)).length) {
      throw new Error(`Return lines contained invalid keys`, lines);
    }

    this.lines = this.lines.map(line => {
      const { startDate, endDate } = line;
      const updatedLine = find(lines, { startDate, endDate });

      const defaultValue = getDefaultQuantity(line, abstractionPeriod);
      return {
        ...line,
        quantity: updatedLine.quantity || defaultValue
      };
    });

    return this;
  }

  setSingleTotal (abstractionPeriod, total) {
    Joi.assert(abstractionPeriod, VALID_ABSTRACTION_PERIOD);
    Joi.assert(total, Joi.number().min(0));
    this.lines = getSingleTotalLines(abstractionPeriod, this.lines, total);
    return this;
  }
}

module.exports = Lines;
