const { trim, isArray, isUndefined, negate, find, identity } = require('lodash');
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
  export: identity,
  postValidate: identity
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
  },
  postValidate: identity
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
    const day = payload[fieldName + '-day'] ? formatDateSegment(payload[fieldName + '-day']) : '';
    const month = payload[fieldName + '-month'] ? `${formatDateSegment(payload[fieldName + '-month'])}-` : '';
    const year = payload[fieldName + '-year'] ? `${formatYearSegment(payload[fieldName + '-year'])}-` : '';

    return `${year}${month}${day}`;
  },
  postValidate: value => {
    // The internal date format is an ISO 8601 string, YYYY-MM-DD, so if we
    // detect that Joi has converted the value into a date object, convert
    // it back to a string
    if (value instanceof Date) {
      return moment(value).format('YYYY-MM-DD');
    }
    return value;
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

/**
 * This mapper is used where you only need a day and month
 * i.e. for the abstraction period of a licence where
 * water is abstracted every year during the same start day-month and end day-month
 * The mapper makes use of the moment().isvalid() method to check it is a valid date
 * This discussion thread includes further details https://github.com/sideway/joi/issues/1245
 */
const dayOfYearMapper = {
  import: (fieldName, payload) => {
    const day = payload[fieldName + '-day'];
    const month = payload[fieldName + '-month'];
    const date = moment(`2001-${formatDateSegment(month === '' ? 'invalid' : month)}-${formatDateSegment(day === '' ? 'invalid' : day)}`);
    // add the year if it is a valid date otherwise add invalid to prevent Javascript to convert this as a date that might pass the Joi.date() validation
    const value = (date.isValid()) ? date.format('YYYY-MM-DD') : `invalid${formatDateSegment(month)}-${formatDateSegment(day)}`;
    return value;
  },
  postValidate: value => {
    const date = moment(value, 'YYYY-MM-DD', true);
    if ((date.isValid())) {
      // the value returned here is the month and day only
      // the year is dropped because it is only used to validate the day and month combination
      return date.format('MM-DD');
    };
    // remove the invalid flag to pass the original value back to the form for correction or remove the the year added by the import.
    return value.includes('invalid') ? value.replace('invalid', '') : value.replace('2001-', '');
  },
  export: (value) => {
    return {
      day: value.day,
      month: value.month
    };
  }
};

const numberMapper = {
  import: (fieldName, payload) => {
    const value = trim(payload[fieldName]).replace(/,/g, '');

    if (value === '') {
      return null;
    }

    if (!isNaN(value)) {
      return parseFloat(value);
    }
    return value;
  },
  export: identity,
  postValidate: identity
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
  },
  postValidate: identity
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
  export: identity,
  postValidate: identity
};

const objectMapper = {

  /**
   * A property of the choices is set as the key with the keyProperty option
   * This is then compared with the payload to find the correct field value
   * @param  {String} fieldName - the name of the form field
   * @param  {Object} payload   - POST/GET payload object
   * @param  {Object} field     - Full field description
   * @return {Object}           Choice object if found
   */
  import: (fieldName, payload, field) => {
    const findOptions = {
      [field.options.keyProperty]: payload[fieldName]
    };
    return find(field.options.choices, findOptions);
  },
  export: identity,
  postValidate: identity
};

exports.defaultMapper = defaultMapper;
exports.booleanMapper = booleanMapper;
exports.dateMapper = dateMapper;
exports.dayOfYearMapper = dayOfYearMapper;
exports.numberMapper = numberMapper;
exports.licenceNumbersMapper = licenceNumbersMapper;
exports.arrayMapper = arrayMapper;
exports.objectMapper = objectMapper;
