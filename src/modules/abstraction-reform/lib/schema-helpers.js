const { find, flatMap } = require('lodash');
const slugify = require('slugify');

// Structure of categories/subcats
// [
//   {
//     slug: 'some-slug',
//     title: 'Category name',
//     subcategories: [{
//       title: 'Subcategory name',
//       schemas: ['id-1', 'id-2']
//     }]
//   }
// ];

const findByTitle = (arr, title) => find(arr, { title });

const createCategory = (schema) => {
  const { category } = schema;
  const slug = slugify(category, { lower: true });
  return {
    title: category,
    slug,
    subcategories: []
  };
};

const createSubcategory = (schema) => {
  const { subcategory } = schema;
  return {
    title: subcategory || '',
    schemas: []
  };
};

/**
 * Adds the specified item to the array and returns the item
 * @param  {Array} arr   - array of items
 * @param  {Mixed} item  - item to add
 * @return {Mixed}       - the item added
 */
const pushAndReturn = (arr, item) => {
  arr.push(item);
  return item;
};

/**
 * Given an array of categories, finds or creates a category for the given schema
 * @param  {Array} arr     - array of categories
 * @param  {Object} schema - WR22 schema
 * @return {Object}        - new or existing category object
 */
const findCategory = (arr, schema) => {
  const { category } = schema;
  return findByTitle(arr, category) || pushAndReturn(arr, createCategory(schema));
};

/**
 * Given an array of subcategories, finds or creates a subcategory for the given schema
 * @param  {Array} arr     - array of subcategories
 * @param  {Object} schema - WR22 schema
 * @return {Object}        - new or existing subcategory object
 */
const findSubcategory = (arr, schema) => {
  const { subcategory } = schema;
  return findByTitle(arr, subcategory) || pushAndReturn(arr, createSubcategory(schema));
};

/**
 * Categorises and subcategorises schema for display in schema selection page
 * If no subcategory is set, it defaults to '-'
 * @param  {Array} schema - list of custom schemas
 * @return {Object}        - indexed by category, subcategory
 */
const getSchemaCategories = (schema) => {
  return schema.reduce((acc, schema) => {
    const category = findCategory(acc, schema);
    const subcategory = findSubcategory(category.subcategories, schema);
    subcategory.schemas.push(schema.id);
    return acc;
  }, []);
};

/**
 * Given a schema, finds the category which contains it
 * @param  {Object} schema - WR22 JSON schema
 * @return {[type]}        [description]
 */
const getSchemaCategory = (categories, id) => {
  return find(categories, category => {
    const ids = flatMap(category.subcategories, subcat => subcat.schemas);
    return ids.includes(id);
  });
};

module.exports = {
  getSchemaCategories,
  getSchemaCategory
};
