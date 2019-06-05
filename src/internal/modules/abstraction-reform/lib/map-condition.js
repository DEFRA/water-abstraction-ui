const { find, pick } = require('lodash');
const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const csvData = fs.readFileSync('./data/condition_titles.csv');
const conditionTitles = parse(csvData, { columns: true });

/**
 * Given a condition object returned from the water service API,
 * return human-readable text
 * @param  {Object} condition - the condition object from water service API
 * @return {String}           - label text to display in WR22 dropdown/radio
 */
const mapConditionText = (condition) => {
  const query = pick(condition, ['code', 'subCode']);
  const { displayTitle } = find(conditionTitles, query);
  const id = condition.id.split('/').pop();
  return `${id}: ${displayTitle}`;
};

module.exports = {
  mapConditionText
};
