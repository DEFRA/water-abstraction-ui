const { find, pick } = require('lodash');
const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const csvData = fs.readFileSync('./data/condition_titles.csv');
const conditionTitles = parse(csvData, { columns: true });
const { logger } = require('../../../logger');

/**
 * Given a condition object returned from the water service API,
 * return human-readable text
 * @param  {Object} condition - the condition object from water service API
 * @return {String}           - label text to display in WR22 dropdown/radio
 */
const mapConditionText = (condition) => {
  const query = pick(condition, ['code', 'subCode']);
  const conditionTitle = find(conditionTitles, query);

  if (!conditionTitle) {
    const message = 'Could not find condition title';
    const error = new Error(message);
    logger.error(message, error, condition);
    throw error;
  }

  const { displayTitle } = conditionTitle;
  const id = condition.id.split('/').pop();
  return `${id}: ${displayTitle}`;
};

exports.mapConditionText = mapConditionText;
