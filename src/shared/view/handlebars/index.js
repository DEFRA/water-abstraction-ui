'use strict';

const commonHelpers = {
  pagination: require('./helpers/pagination'),
  equal: require('handlebars-helper-equal'),
  includes: require('./helpers/includes'),
  ngrPoint: require('./helpers/ngr').ngrPoint,
  ngrPointStr: require('./helpers/ngr').ngrPointStr,
  precision: require('./helpers/precision'),
  for: require('./helpers/for'),
  formatPeriod: require('./helpers/format-period'),
  formatToDate: require('./helpers/format-to-date'),
  formatSortableDate: require('./helpers/format-sortable-date'),
  formatDate: require('./helpers/format-date'),
  getDatePart: require('./helpers/get-date-part'),
  concat: require('./helpers/concat'),
  add: require('./helpers/add'),
  subtract: require('./helpers/subtract'),
  queryString: require('./helpers/query-string'),
  sortIcon: require('./helpers/sort').sortIcon,
  sortQuery: require('./helpers/sort').sortQuery,
  lessThan: require('./helpers/less-than'),
  greaterThan: require('./helpers/greater-than'),
  hasWidgetErrors: require('./helpers/widget').hasWidgetErrors,
  widgetErrors: require('./helpers/widget').widgetErrors,
  notNull: require('./helpers/not-null'),
  notEqual: require('./helpers/not-equal')
};

const registerCommonHelpers = handlebars => {
  for (const [key, value] of Object.entries(commonHelpers)) {
    handlebars.registerHelper(key, value);
  }
  return handlebars;
};

exports.registerCommonHelpers = registerCommonHelpers;
