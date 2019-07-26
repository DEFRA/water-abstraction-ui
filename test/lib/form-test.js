const { find, get } = require('lodash');

const findField = (form, query) => {
  if (typeof (query) === 'string') {
    return find(form.fields, { name: query });
  }
  // Predicate supported by lodash
  return find(form.fields, query);
};
const findButton = form => findField(form, field => get(field, 'options.widget') === 'button');

exports.findField = findField;
exports.findButton = findButton;
