
/**
 * For the abstraction reform WR22 condition work, we have created a
 * URI format for each piece of data in NALD exposed via the water service
 * to allow us to link to that data with a single value.
 * For example, a condition looks like: nald://conditions/1/12345
 * The format is nald://entity/regionId/id
 * This function parses the URL into constituent parts
 *
 * @param  {String} uri - NALD data URI
 * @return {Object}     parsed data
 */
const parseNaldDataURI = (uri) => {
  const r = new RegExp('^nald://([^/]+)/([^/]+)/([^/]+)');

  const match = r.exec(uri);

  if (match) {
    return {
      entity: match[1],
      regionId: parseInt(match[2]),
      id: parseInt(match[3])
    };
  }
  throw new Error(`Error parsing NALD data URI ${uri}`);
};

module.exports = {
  parseNaldDataURI
};
