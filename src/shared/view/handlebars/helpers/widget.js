'use strict';

const hasWidgetErrors = function (fieldName, errors = [], options) {
  const hasError = errors.reduce((acc, error) => {
    if (error.field === fieldName) {
      return true;
    }
    return acc;
  }, false);
  return hasError ? options.fn(this) : options.inverse(this);
};

const widgetErrors = function (fieldName, errors = []) {
  let str = '';
  errors.forEach((error) => {
    if (error.field === fieldName) {
      str += `<span class="error-message">${error.message}</span>`;
    }
  });
  return str;
};

exports.hasWidgetErrors = hasWidgetErrors;
exports.widgetErrors = widgetErrors;
