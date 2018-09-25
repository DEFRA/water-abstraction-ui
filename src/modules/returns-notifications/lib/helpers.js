const { uniq } = require('lodash');

const getUniqueLicenceNumbers = (returns) => {
  return uniq(returns.map(row => row.licence_ref));
};

module.exports = {
  getUniqueLicenceNumbers
};
