/**
 * Creates a new object by merging the two supplied objects
 * @param  {Object} obj1 - the first object to merge
 * @param  {Object} obj2 - the second object to merge
 * @return {Object}      the merged object
 */
const merge = (obj1, obj2) => {
  return Object.assign({}, obj1, obj2);
};

module.exports = {
  merge
};
