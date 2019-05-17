const filters = require('./filters');

/**
 * Adds filters to supplied nunjucks environment
 * @param {Object} env - nunjucks environment
 * @return {Object} env - nunjucks environment
 */
const addFilters = (env) => {
  for (let key in filters) {
    env.addFilter(key, filters[key]);
  }

  return env;
};

module.exports = {
  addFilters
};
