const { get, set } = require('lodash');

/**
 * Categorises and subcategorises schema for display in schema selection page
 * If no subcategory is set, it defaults to '-'
 * @param  {Array} schema - list of custom schemas
 * @return {Object}        - indexed by category, subcategory
 */
const getSchemaCategories = (schema) => {
  const acc = {};
  for (let key in schema) {
    const { category, subcategory = '-' } = schema[key];
    const length = get(acc, `${category}.${subcategory}.length`, 0);
    set(acc, `${category}.${subcategory}.${length}`, key);
  }
  return acc;
};

module.exports = {
  getSchemaCategories
};
