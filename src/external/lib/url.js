const { isEmpty, pick, flatten } = require('lodash');
const querystring = require('querystring');

/**
 * Appends a subset of the query params to the path to create a new url
 *
 * @param {String} path The path of the URL to append the subset of query params to
 * @param {Object} query An object representation of the query string
 * @param  {...String} subsetKeys The keys of the query params to add to the path
 */
const withQueryStringSubset = (path, query, ...subsetKeys) => {
  const subset = pick(query, flatten(subsetKeys));

  return isEmpty(subset)
    ? path
    : `${path}?${querystring.encode(subset)}`;
};

exports.withQueryStringSubset = withQueryStringSubset;
