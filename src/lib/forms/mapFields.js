const { cloneDeep, isObject } = require('lodash');

/**
 * Applies the supplied function to every field
 * using a deep traversal
 * Mutates the supplied object
 */
const mapFields = (form, fn) => {
  const f = cloneDeep(form);
  if (isObject(f)) {
    if ('fields' in f) {
      f.fields = f.fields.map(fn);
    }
    for (let key in f) {
      if (isObject(f[key])) {
        f[key] = mapFields(f[key], fn);
      }
    }
  }
  return f;
};

module.exports = { mapFields };
