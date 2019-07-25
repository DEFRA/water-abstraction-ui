/* eslint camelcase: "warn" */

const handlebars = require('handlebars');
const moment = require('moment');
const momentTimezone = require('moment-timezone');
const qs = require('querystring');
const sentenceCase = require('sentence-case');
const titleCase = require('title-case');
const marked = require('marked');
const { isString } = require('lodash');

const timezone = 'Europe/London';
const { pick, reduce } = require('lodash');
const Joi = require('@hapi/joi');

const commaNumber = require('comma-number');
const { convertToCubicMetres } = require('../../../shared/lib/unit-conversion');
const { maxPrecision } = require('../../../shared/lib/number-formatter');
const { splitString } = require('../../../shared/lib/string-formatter');

/**
 * Formats numbers with commas to separate thousands, eg. 1,000
 * @param {Number} value
 * @return {String} number formatted
 */
handlebars.registerHelper('commaNumber', function (value) {
  return commaNumber(value);
});

/**
 * Converts gallons to cubic metres
 * @param {Number} value
 * @return {String} number formatted
 */
handlebars.registerHelper('gallonsToCubicMetres', function (value) {
  return value * 0.00454609;
});

/**
 * Converts cubic metres to gallons
 * @param {Number} value
 * @return {String} number formatted
 */
handlebars.registerHelper('cubicMetresToGallons', function (value) {
  return value / 0.00454609;
});

/**
 * Creates a pagination anchor tag for the pagination helper
 * @param {String} url - base URL, e.g. /some/page
 * @param {Object} params - key/value pairs of query string parameters, the page number will be merged with these
 * @param {Number} page - the page for the page link
 * @param {Object} options
 * @param {String} options.ariaLabel - the aria label text
 * @param {Boolean} options.isActive - whether this is an active pagination link
 * @return {String} link html
 */
function paginationLink (url, params, page, options = {}) {
  const fullUrl = `${url}?${qs.stringify({ ...params, page })}`;
  const ariaLabel = options.ariaLabel ? `aria-label="${options.ariaLabel}"` : null;
  return `<a class="pagination__link${options.isActive ? ' pagination__link--active' : ''}" href="${fullUrl}" ${ariaLabel}>`;
}

handlebars.registerHelper('pagination', function (pagination = {}, options) {
  const { url = '/', params = {} } = options.hash;
  const { page, pageCount = 0 } = pagination;

  if (pageCount <= 1) {
    return null;
  }

  let html = `<nav role="navigation" aria-label="Pagination navigation">
    <ol class="pagination">`;

  // Previous page link
  html += `<li class="pagination__item" ${page === 1 ? 'aria-hidden="true"' : ''}>`;
  if (page > 1) {
    html += paginationLink(url, params, page - 1, { ariaLabel: 'Previous page' }) + `&larr; Previous page</a>`;
  } else {
    html += '&larr; Previous page';
  }
  html += '</li>';

  // Each page link
  for (let i = 1; i <= pageCount; i++) {
    html += `<li class="pagination__item">`;
    html += paginationLink(url, params, i, { isActive: page === i });
    html += `<span class="sr-only">Page </span> ${i}`;
    if (i === page) {
      html += `<span class="sr-only"> - current page</span>`;
    }
    html += `</a></li>`;
  }

  // Next page link
  html += `<li class="pagination__item" ${page === pageCount ? 'aria-hidden="true"' : ''}>`;
  if (page < pageCount) {
    html += paginationLink(url, params, page + 1, { arialLabel: 'Next page' }) + `Next page &rarr;</a>`;
  } else {
    html += 'Next page &rarr;';
  }
  html += '</li>';

  html += `</ol>
  </nav>`;

  return html;
});

handlebars.registerHelper('markdown', function (param = '') {
  // Replace ^ with > because notify represents a blockquote using the carat.
  const updated = param.replace(/\^/g, '>');
  return marked(updated);
});

handlebars.registerHelper('sentenceCase', function (value) {
  return sentenceCase(value);
});

handlebars.registerHelper('titleCase', function (value) {
  return titleCase(value);
});

handlebars.registerHelper('for', function (from, to, incr, block) {
  var accum = '';
  for (var i = from; i < to; i += incr) { accum += block.fn(i); }
  return accum;
});

handlebars.registerHelper('equal', require('handlebars-helper-equal'));

handlebars.registerHelper('ifNot', function (param, options) {
  if (!param) {
    return options.fn(this);
  }
  return options.inverse(this);
});

handlebars.registerHelper('notEqual', function (v1, v2, options) {
  if (v1 !== v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

handlebars.registerHelper('notNull', function (param, options) {
  if (param !== null) {
    return options.fn(this);
  }
});

handlebars.registerHelper('hasWidgetErrors', function (fieldName, errors = [], options) {
  const hasError = errors.reduce((acc, error) => {
    if (error.field === fieldName) {
      return true;
    }
    return acc;
  }, false);
  return hasError ? options.fn(this) : options.inverse(this);
});

handlebars.registerHelper('widgetErrors', function (fieldName, errors = [], options) {
  let str = '';
  errors.forEach((error) => {
    if (error.field === fieldName) {
      str += `<span class="error-message">${error.message}</span>`;
    }
  });
  return str;
});

/**
 * 1 megalitre = 1,000,000 litres = 1,000 cubic metres
 * @param {float} value - the value in cubic metres per second
 * @param {String} unit - can be cm|litre|megalitre
 * @param {String} period - can be second|day
 */
handlebars.registerHelper('flowConverter', function (value, unit = 'litre', period = 'second', options) {
  let val = value;

  // Validate
  const { error } = Joi.validate({ unit, period }, {
    unit: Joi.string().allow('cm', 'litre', 'megalitre'),
    period: Joi.string().allow('second', 'day')
  });

  if (error) {
    throw error;
  }

  if (unit === 'litre') {
    val = val * 1000;
  }
  if (unit === 'megalitre') {
    val = val / 1000;
  }
  if (period === 'day') {
    val = val * 86400;
  }

  return parseFloat(val).toFixed(1);
});

/*
handlebars.registerHelper('toFixed', function (value, dp) {
  return parseFloat(value).toFixed(dp);
});

handlebars.registerHelper('toMega')
*/

/**
 * Gets gauging station value with units
 * - For flows, converts m3/s to m3/day
 * - For levels, adds mASD to datum and returns in m
 */
handlebars.registerHelper('gsValue', function (measure, convertTo, options) {
  const { unitName, latestReading: { value } } = measure;

  // Flows - convert to m3/day
  if (unitName === 'm3/s') {
    if (convertTo === 'm3/day') {
      return `${(value * 86400).toFixed(1)}m³/day`;
    }

    return `${(value).toFixed(1)}m³/s`;

    // return `${(value * 86400).toFixed(1)}m³/day`;
  }

  // Levels in mASD - convert to level in m
  if (unitName === 'mASD') {
    return `${(value).toFixed(2)}m`;
  }

  // Unknown unit - return as is
  return `${value}${unitName}`;
});

/**
 * Tests whether given condition code and subcode is a hands-off flow (HOF)
 * @param {String} code - condition code
 * @param {String} subCode - condition subcode
 */
handlebars.registerHelper('isHof', function (code, subCode, options) {
  if (code === 'CES' && (subCode === 'FLOW' || subCode === 'LEV')) {
    return options.fn(this);
  }
  return options.inverse(this);
});

handlebars.registerHelper('greaterThan', function (v1, v2, options) {
  if (v1 > v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

handlebars.registerHelper('lessThan', function (v1, v2, options) {
  if (v1 < v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

handlebars.registerHelper('or', function (v1, v2, options) {
  if (v1 || v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

/**
 * A handlebars helper to get a query string for sorting data
 */
handlebars.registerHelper('sortQuery', function (context, options) {
  const { direction, sort, field, ...params } = arguments[0].hash;
  const newDirection = (direction === 1) && (sort === field) ? -1 : 1;
  const query = Object.assign(params, { sort: field, direction: newDirection });
  return qs.stringify(query, '&amp;');
});

/**
 * A handlebars helper to get a query string for sorting data
 */
handlebars.registerHelper('queryString', function (context, options) {
  return qs.stringify(arguments[0].hash, '&amp;');
});

/**
 * A handlebars helper to get a sort direction triangle
 */
handlebars.registerHelper('sortIcon', function (context, options) {
  const { direction, sort, field } = arguments[0].hash;
  const newDirection = (direction === 1) && (sort === field) ? -1 : 1;

  if (sort === field) {
    const visual = '<span class="sort-icon" aria-hidden="true">' + (newDirection === -1 ? '&#x25B2;' : '&#x25BC;') + '</span>';
    const sr = `<span class="sr-only">${newDirection === -1 ? 'descending' : 'ascending'}</span>`;
    return visual + sr;
  }
});

/**
 * A handlebars helper to add two numbers
 */
handlebars.registerHelper('add', function () {
  return arguments[0] + arguments[1];
});

/**
 * A handlebars helper to subtract two numbers
 */
handlebars.registerHelper('subtract', function () {
  return arguments[0] - arguments[1];
});

handlebars.registerHelper('concat', function () {
  var arg = Array.prototype.slice.call(arguments, 0);
  arg.pop();
  return arg.join('');
});

handlebars.registerHelper('join', function (values, separator = ',') {
  return values.join(separator);
});

handlebars.registerHelper('encode', function (value) {
  return encodeURIComponent(value.hash.value);
});

handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});

handlebars.registerHelper('stringify', function (variable) {
  var arg = JSON.stringify(variable);
  return arg;
});

handlebars.registerHelper('parse', function (variable) {
  try {
    var arg = JSON.parse(variable);
  } catch (e) {
    return variable;
  }

  return arg;
});

const getDatePartFromString = (date, part) => {
  const indexes = { year: 0, month: 1, day: 2 };
  return splitString(date, indexes[part], '-');
};

const getDatePartFromDate = (date, part) => {
  let datePart;

  if (part === 'year') {
    datePart = date.getFullYear();
  }

  if (part === 'month') {
    datePart = date.getMonth() + 1;
  }

  if (part === 'day') {
    datePart = date.getDate();
  }

  return datePart.toString();
};

const getDatePart = (date, part) => {
  if (!['day', 'month', 'year'].includes(part)) {
    const err = 'Unknown date part requested. Supports day, month and year';
    throw new Error(err);
  }

  if (!date) {
    return;
  }

  const func = isString(date) ? getDatePartFromString : getDatePartFromDate;
  return func(date, part);
};

handlebars.registerHelper('getDatePart', getDatePart);

handlebars.registerHelper('formatISODate', function (dateInput, options) {
  const date = momentTimezone(dateInput);
  const { format = 'D MMMM YYYY' } = options.hash;
  return date.isValid() ? date.tz(timezone).format(format) : dateInput;
});

handlebars.registerHelper('formatISOTime', function (dateInput) {
  const date = momentTimezone(dateInput);
  return date.isValid() ? date.tz(timezone).format('h:mma') : dateInput;
});

handlebars.registerHelper('isFirstDayOfMonth', function (date, options) {
  if (moment(date).startOf('month').isSame(date, 'day')) {
    return options.fn(this);
  }
  return options.inverse(this);
});

handlebars.registerHelper('isLastDayOfMonth', function (date, options) {
  if (moment(date).endOf('month').isSame(date, 'day')) {
    return options.fn(this);
  }
  return options.inverse(this);
});

handlebars.registerHelper('formatDate', function (dateInput) {
  var date = moment(dateInput, 'DD/MM/YYYY');
  var isFutureDate = moment().isBefore(date);
  if (isFutureDate) {
    date.subtract('year', 100);
  }
  return date.isValid() ? date.format('D MMMM YYYY') : dateInput;
});

const changeDateFormatting = (dateInput, inputFormat, outputFormat = 'D MMMM YYYY') => {
  const date = moment(dateInput, inputFormat);
  return date.isValid() ? date.format(outputFormat) : dateInput;
};

handlebars.registerHelper('formatSortableDate', dateInput => changeDateFormatting(dateInput, 'YYYYMMDD'));
handlebars.registerHelper('formatTS', dateInput => changeDateFormatting(dateInput, 'YYYY-MM-DD'));

handlebars.registerHelper('formatToDate', function (dateInput, defaultValue) {
  if (dateInput === null) {
    return defaultValue;
  }
  var date = moment(dateInput, 'MM/DD/YYYY');
  if (!date.isValid()) {
    date = moment(dateInput, 'DD/MM/YYYY');
  }
  return date.isValid() ? date.format('D MMMM YYYY') : dateInput;
});

handlebars.registerHelper('formatPeriod', function (inputStart = '', inputEnd = '') {
  if (inputStart.indexOf('-') !== -1) {
    var tmpInputStart = inputStart.split('-')[0] + '/' + inputStart.split('-')[1] + '/2000';
    var tmpInputEnd = inputEnd.split('-')[0] + '/' + inputEnd.split('-')[1] + '/2000';
    var periodStart = moment(tmpInputStart, 'DD/MMM/YYYY');
    var periodEnd = moment(tmpInputEnd, 'DD/MMM/YYYY');
  } else {
    tmpInputStart = inputStart + '/2000';
    tmpInputEnd = inputEnd + '/2000';
    periodStart = moment(tmpInputStart, 'DD/MM/YYYY');
    periodEnd = moment(tmpInputEnd, 'DD/MM/YYYY');
  }
  return 'From ' + periodStart.format('D MMMM') + ' until ' + periodEnd.format('D MMMM');
});

handlebars.registerHelper('formatNotifyAddress', function (address) {
  const addressParts = pick(address, [
    'address_line_1', 'address_line_2', 'address_line_3',
    'address_line_4', 'address_line_5', 'address_line_6',
    'postcode'
  ]);

  return reduce(addressParts, (acc, part) => {
    return part ? `${acc}${part}<br />` : acc;
  }, '');
});

/**
 * Format NGR point string, e.g. ST123456 so it has spaces, e.g. ST 123 456
 */
handlebars.registerHelper('ngrPointStr', function (str) {
  const prefix = str.substr(0, 2);
  const length = (str.length - 2) / 2;
  return prefix + ' ' + str.substr(2, length) + ' ' + str.substr(2 + length, length);
});

handlebars.registerHelper('ngrPoint', function (points) {
  if (typeof (points) === 'undefined') {
    return null;
  }

  function formatGridReference (reference) {
    // The length of one of the numbers in the NGR is the length of the whole thing
    // minus the two letters at the start, then divided by two (as there are two numbers)
    var accuracy = (reference.length - 2) / 2;
    return reference.substring(0, 2) + ' ' +
      reference.substring(2, 2 + accuracy) + ' ' +
      reference.substring(2 + accuracy);
  }

  var response = '';

  var point = 'ngr1' in points ? points : points[0];

  if (point.ngr4) {
    response = `Within the area formed by the straight lines running between National Grid References ` +
      formatGridReference(point.ngr1) + ', ' +
      formatGridReference(point.ngr2) + ', ' +
      formatGridReference(point.ngr3) + ' and ' +
      formatGridReference(point.ngr4);
  } else if (point.ngr2) {
    response = `Between National Grid References ` + formatGridReference(point.ngr1) + ` and ` + formatGridReference(point.ngr2);
  } else {
    response = `At National Grid Reference ` + formatGridReference(point.ngr1);
  }
  if (point.name && point.name.length !== 0) {
    response += ` (${point.name})`;
  }

  return response;
});

handlebars.registerHelper('precision', function (value, dp) {
  return Number(value).toFixed(dp);
});

handlebars.registerHelper('yesIfTruthy', value => value ? 'Yes' : '');

handlebars.registerHelper('naldRegion', function (code) {
  const codes = {
    1: 'Anglian',
    2: 'Midlands',
    3: 'North east',
    4: 'North west',
    5: 'South west',
    6: 'Southern',
    7: 'Thames'
  };

  return codes[code];
});

/**
 * Accepts an object containing period start/end month/day
 * and returns a string in the format 20 January to 30 December
 * @param {Object} metadata
 * @return {String} formatted date
 */
handlebars.registerHelper('returnPeriod', function (metadata) {
  const { periodEndDay,
    periodEndMonth,
    periodStartDay,
    periodStartMonth } = metadata;

  const start = moment().month(periodStartMonth - 1).date(periodStartDay);
  const end = moment().month(periodEndMonth - 1).date(periodEndDay);

  return start.format('D MMMM') + ' to ' + end.format('D MMMM');
});

/**
 * Converts a value in cubic metres to the specified user unit
 * @param {Object} metadata
 * @return {String} formatted date
 */
handlebars.registerHelper('convertToCubicMetres', (value, options) => {
  const { unit } = options.hash;
  return convertToCubicMetres(value, unit);
});

/**
 * Formats a number to 3 DP and comma separates 000's
 */
handlebars.registerHelper('formatQuantity', (value) => {
  return commaNumber(maxPrecision(value, 3));
});

/**
 * Splits a string to array, and gets the numbered segment
 */
handlebars.registerHelper('splitString', (value, options) => {
  const { index = 0, separator = ',' } = options.hash;
  return splitString(value, index, separator);
});

/**
 * Splits a string to array, and gets the numbered segment
 */
handlebars.registerHelper('includes', (arr = [], options) => {
  const { value } = options.hash;
  if (arr.includes(value)) {
    return options.fn(this);
  }
  return options.inverse(this);
});

/**
 * Each iterates in reverse order
 * @see {@link https://github.com/diy/handlebars-helpers/blob/master/lib/each-reverse.js}
 */
function eachReverse (context) {
  var options = arguments[arguments.length - 1];
  var ret = '';

  if (context && context.length > 0) {
    for (var i = context.length - 1; i >= 0; i--) {
      ret += options.fn(context[i]);
    }
  } else {
    ret = options.inverse(this);
  }

  return ret;
};
handlebars.registerHelper('eachReverse', eachReverse);

module.exports = handlebars;
