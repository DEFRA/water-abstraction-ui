const glob = require('glob');
const { cloneDeep, sortBy } = require('lodash');
const path = require('path');
const fs = require('fs');

const schemaPath = path.join(__dirname, '../schema/wr22/');

/**
 * Given a WR22 schema filename, e.g. 1.14.json, returns a version which can
 * be used in sorting, e.g. 001.014
 * @param  {String} file - the WR22 JSON schema filename
 * @return {String}      - sortable version
 */
const getSortableFilename = (file) => {
  const [integer, fraction] = file.split('.');
  return `${integer.padStart(3, '0')}.${fraction.padStart(3, '0')}`;
};

/**
 * Load the JSON file specified and parse
 * @param  {String} fileName - the JSON file
 * @return {Object}          parsed JSON
 */
const loadJson = (fileName) => {
  const data = fs.readFileSync(`${schemaPath}${fileName}`);
  return JSON.parse(data);
};

/**
 * Loads all the WR22 condition schema in an array, sorted by the schema
 * number
 * @return {Array} Array of JSON schema objects
 */
const loadSchema = () => {
  const files = glob.sync('*.json', { cwd: schemaPath });
  const sorted = sortBy(files, getSortableFilename);
  const sortedSchemas = sorted.map(loadJson);
  return sortedSchemas.filter(schema => !schema.hidden);
};

const schema = loadSchema();

module.exports = {

  /**
   * An array of the JSON schema used for WR22 conditions
   * @type {Array}
   */
  getWR22 () {
    return schema.map(cloneDeep);
  }
};
