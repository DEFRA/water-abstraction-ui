const { isArray, isUndefined, negate } = require('lodash');
const moment = require('moment');
const isDefined = negate(isUndefined);
const { extractLicenceNumbers } = require('../licence-helpers');

/**
 * Default mapper - simply extracts the value of the named field
 */
const defaultMapper = {
  import: (fieldName, payload) => {
    return payload[fieldName];
  },
  export: (value) => {
    return value;
  }
};

/**
 * Boolean mapper - maps a boolean value to a string 'true' or 'false'
 */
const booleanMapper = {
  import: (fieldName, payload) => {
    const value = payload[fieldName];
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return undefined;
  },
  export: (value) => {
    if (value === true) {
      return 'true';
    }
    if (value === false) {
      return 'false';
    }
    return undefined;
  }
};

/**
 * Formats a date segment - day, month or year, by zero padding
 * @param {String} value
 * @param {Number} [length] - the length of the segment, default 2
 * @return {String} zero-padded value, or emoty string
 */
const formatDateSegment = (value, length = 2) => {
  if (value) {
    return value.padStart(length, '0');
  }
  return '';
};

/**
 * Formats a year segment.  If a 2 digit year is entered, this is corrected
 * to a 4 digit date
 * @param {String} year 2/4 digit
 * @return {String} year 4 digit
 */
const formatYearSegment = (year) => {
  if (year) {
    const str = year.trim();
    const currentYear = moment().format('YYYY');
    return str.length === 2 ? currentYear.substr(0, 2) + str : str;
  }
  return '';
};

/**
 * Date mapper - combines the day month and year form values to a single
 * string formatted as YYYY-MM-DD
 */
const dateMapper = {
  import: (fieldName, payload) => {
    const day = payload[fieldName + '-day'];
    const month = payload[fieldName + '-month'];
    const year = payload[fieldName + '-year'];
    return `${formatYearSegment(year)}-${formatDateSegment(month)}-${formatDateSegment(day)}`;
  },
  export: (value) => {
    const parts = value.split('-');
    return {
      day: parts[2],
      month: parts[1],
      year: parts[0]
    };
  }
};

const numberMapper = {
  import: (fieldName, payload) => {
    const value = payload[fieldName];
    if (value === '') {
      return null;
    }
    if (!isNaN(value)) {
      return parseFloat(value);
    }
    return value;
  },
  export: (value) => {
    return value;
  }
};

/**
 * Delimited mapper - for a pasted set of licence numbers, splits string on common
 * delimiters , newlines, tabs, semicolon
 */
const licenceNumbersMapper = {
  import: (fieldName, payload) => {
    return extractLicenceNumbers(payload[fieldName]);
  },
  export: (value) => {
    return value.join(', ');
  }
};

/**
 * For checkbox fields, need to force HAPI payload to an array.  If only one
 * checkbox is ticked, the value is sent as a string
 */
const arrayMapper = {
  import: (fieldName, payload) => {
    const value = payload[fieldName];
    const arr = isArray(value) ? value : [value];
    return arr.filter(isDefined);
  },
  export: (value) => {
    return value;
  }
};

module.exports = {
  defaultMapper,
  booleanMapper,
  dateMapper,
  numberMapper,
  licenceNumbersMapper,
  arrayMapper
};
