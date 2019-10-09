'use strict';

const handlebars = require('handlebars');
const { registerCommonHelpers } = require('shared/view/handlebars');

const momentTimezone = require('moment-timezone');
const marked = require('marked');

const timezone = 'Europe/London';

handlebars.registerHelper('markdown', function (param = '') {
  // Replace ^ with > because notify represents a blockquote using the carat.
  const updated = param.replace(/\^/g, '>');
  return marked(updated);
});

handlebars.registerHelper('toLowerCase', str => str.toLowerCase());

handlebars.registerHelper('formatISODate', function (dateInput, options) {
  const date = momentTimezone(dateInput);
  const { format = 'D MMMM YYYY' } = options.hash;
  return date.isValid() ? date.tz(timezone).format(format) : dateInput;
});

module.exports = registerCommonHelpers(handlebars);
