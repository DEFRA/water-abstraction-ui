'use strict';

const qs = require('querystring');

/**
 * A handlebars helper to get a query string for sorting data
 */
const sortQuery = function (context, options) {
  const { direction, sort, field, ...params } = arguments[0].hash;
  const newDirection = (direction === 1) && (sort === field) ? -1 : 1;
  const query = Object.assign(params, { sort: field, direction: newDirection });
  return qs.stringify(query, '&amp;');
};

const getNewDirection = (direction, sort, field) => {
  return (direction === 1) && (sort === field) ? -1 : 1;
};

const getDirectionDisplayValues = direction => {
  return direction === -1
    ? { visual: '&#x25B2;', screenReader: 'descending' }
    : { visual: '&#x25BC;', screenReader: 'ascending' };
};

/**
 * A handlebars helper to get a sort direction triangle
 */
const sortIcon = function (context, options) {
  const { direction, sort, field } = arguments[0].hash;
  const newDirection = getNewDirection(direction, sort, field);
  const displayValues = getDirectionDisplayValues(newDirection);

  if (sort === field) {
    const visual = `<span class="sort-icon" aria-hidden="true">${displayValues.visual}</span>`;
    const sr = `<span class="sr-only">${displayValues.screenReader}</span>`;
    return visual + sr;
  }
};

exports.sortQuery = sortQuery;
exports.sortIcon = sortIcon;
