const querystring = require('querystring');
const { sortNewDirection } = require('./sort-new-direction');

const sortQuery = (query, field) => {
  const newDirection = sortNewDirection(query, field);
  const newQuery = Object.assign({}, query, { sort: field, direction: newDirection });
  return querystring.stringify(newQuery);
};

exports.sortQuery = sortQuery;
