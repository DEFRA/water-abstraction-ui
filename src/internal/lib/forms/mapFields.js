const { cloneDeep, isObject } = require('lodash');

/**
 * Applies the supplied function to every field
 * using a deep traversal
 */
const mapFields = (form, fn) => {
  const f = cloneDeep(form);

  if (!isObject(f)) {
    return f;
  }

  if ('fields' in f) {
    f.fields = f.fields.map(fn);
  }

  for (const key in f) {
    f[key] = mapFields(f[key], fn);
  }
  return f;
};

module.exports = { mapFields };
