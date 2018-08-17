/* eslint camelcase: "warn" */

const handlebars = require('handlebars');
const moment = require('moment');
const momentTimezone = require('moment-timezone');
const qs = require('querystring');
const sentenceCase = require('sentence-case');
const titleCase = require('title-case');
const marked = require('marked');

const Helpers = require('../lib/helpers');
const DynamicView = require('../lib/dynamicview');

const timezone = 'Europe/London';
const { pick, reduce } = require('lodash');
const Joi = require('joi');

const commaNumber = require('comma-number');

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

handlebars.registerHelper('pagination', function (pagination, options) {
  const { url = '/', params = {} } = options.hash;
  const { page, pageCount } = pagination;

  if (pageCount <= 1) {
    return null;
  }

  let html = `<nav role="navigation" aria-label="Pagination navigation">
    <ol class="pagination">`;

  // Previous page link
  html += `<li class="pagination__item" ${page === 1 ? 'aria-hidden="true"' : ''}>`;
  if (page > 1) {
    html += paginationLink(url, params, page - 1, {ariaLabel: 'Previous page'}) + `&larr; Previous page</a>`;
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
  console.log(value);
  console.log(encodeURIComponent(value.hash.value));
  return encodeURIComponent(value.hash.value);
});

handlebars.registerHelper('dynamicView', function () {
  /**
  The dynamicView helper loads javascript renderers from the views/partials/jsPartials directory
  **/
  var args = Array.prototype.slice.call(arguments, 0).pop();
  var requestedFunction = args.hash.viewType;
  if (DynamicView[requestedFunction]) {
    return `${DynamicView[requestedFunction].getContent(args)}`;
  } else {
    return `Error: Unknown component: ${requestedFunction}`;
  }
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
handlebars.registerHelper('showhide', function () {
  var arg = Array.prototype.slice.call(arguments, 0);
  arg.pop();
  var htmlContent = '';
  htmlContent += '';
  htmlContent += '<details>';
  htmlContent += '<summary><span class="summary" tabindex="0">' + arg[0] + '</span></summary>';
  htmlContent += '<div class="panel panel-border-narrow">';
  htmlContent += '<h3 class="heading-small">' + arg[1] + '</h3>';
  htmlContent += arg[2];
  htmlContent += '</div>';
  htmlContent += '</details>';
  return htmlContent;
});

handlebars.registerHelper('guid', function () {
  return Helpers.createGUID();
});

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
  console.log('formatDate');

  console.log(dateInput);
  var date = moment(dateInput, 'DD/MM/YYYY');
  console.log(date);
  var isFutureDate = moment().isBefore(date);
  if (isFutureDate) {
    date.subtract('year', 100);
  }
  console.log('Future date:' + isFutureDate);

  return date.isValid() ? date.format('D MMMM YYYY') : dateInput;
});

handlebars.registerHelper('formatSortableDate', function (dateInput) {
  const date = moment(dateInput, 'YYYYMMDD');
  return date.isValid() ? date.format('D MMMM YYYY') : dateInput;
});

handlebars.registerHelper('formatTS', function (dateInput) {
  console.log('formatDate');

  console.log(dateInput);
  var date = moment(dateInput, 'YYYY-MM-DD');
  return date.isValid() ? date.format('D MMMM YYYY') : dateInput;
});

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

handlebars.registerHelper('formatAddress', function (address) {
  var formattedAddress = address.addressLine1 + '<br/>';
  formattedAddress += address.addressLine2 ? address.addressLine2 + '<br/>' : '';
  formattedAddress += address.addressLine3 ? address.addressLine3 + '<br/>' : '';
  formattedAddress += address.addressLine4 ? address.addressLine4 + '<br/>' : '';
  formattedAddress += address.town ? address.town + '<br/>' : '';
  formattedAddress += address.county ? address.county + '<br/>' : '';
  formattedAddress += address.country ? address.country + '<br/>' : '';
  formattedAddress += address.postCode;
  return formattedAddress;
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

handlebars.registerHelper('maxQuantities', function (quantities) {
  return Number(quantities.maxDailyQuantity).toFixed(2) + ' cubic metres per day <br/>' + Number(quantities.maxAnnualQuantity).toFixed(2) + ' cubic metres per year';
});

handlebars.registerHelper('precision', function (value, dp) {
  return Number(value).toFixed(dp);
});

handlebars.registerHelper('abstractionConditions', function (quantities) {
  return 'Abstraction conditions TODO:';
});

const Path = require('path');

const footerSupportLinks = `
  <h2 class="sr-only">Support Links</h2>
  <ul>
    <li><a href="/cookies">Cookies</a></li>
    <li><a href="/privacy-policy">Privacy</a></li>
    <li><a href="/accessibility">Accessibility</a></li>
  </ul>
`;

const defaultContext = {
  assetPath: '/public/',
  topOfPage: 'Login Handler',
  head: '<link href="public/stylesheets/overrides.css" media="screen" rel="stylesheet" />',
  pageTitle: ' Generic Page',
  htmlLang: 'en',
  bodyClasses: 'some classes here',
  bodyStart: 'Body Start',
  skipLinkMessage: 'Skip to main content',
  cookieMessage: 'GOV.UK use cookies to make the site simpler. <a href="/cookies">Find out more about cookies.</a>',
  headerClass: 'some classes here',
  homepageUrl: 'https://www.gov.uk/',
  logoLinkTitle: 'Logo Link Title',
  globalHeaderText: 'GOV.UK',
  insideHeader: '',

  propositionLinks: [],

  afterHeader: '',
  footerTop: '',
  footerSupportLinks,
  licenceMessage: '<p>All content is available under the <a href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" rel="license">Open Government Licence v3.0</a>, except where otherwise stated</p>',
  bodyEnd: ''
};
module.exports = {
  engines: {
    html: handlebars
  },
  relativeTo: __dirname,
  path: Path.join(__dirname, ''),
  layoutPath: Path.join(__dirname, 'govuk_template_mustache/layouts'),
  layout: 'govuk_template',
  partialsPath: Path.join(__dirname, 'partials/'),
  context: defaultContext,
  isCached: process.env.NODE_ENV === 'production'
};
