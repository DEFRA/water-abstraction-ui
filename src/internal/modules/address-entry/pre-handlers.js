const Boom = require('@hapi/boom');
const services = require('../../lib/connectors/services');
const helpers = require('./lib/helpers');

const getPostcode = request => {
  const { postcode: queryPostcode } = request.query;
  if (queryPostcode) return queryPostcode;
  return helpers.getPostcode(request);
};

/**
 * Retrieves addresses for the specified postcode,
 * or a Boom 404 error if not found
 * @param {String} request.query.postcode - postcode entered by user
 * @param {Promise<Array>}
 */
const searchForAddressesByPostcode = async request => {
  const postcode = getPostcode(request);
  try {
    const { data } = await services.water.addressSearch.getAddressSearchResults(postcode);
    return data;
  } catch (err) {
    if (err.statusCode === 404) {
      return Boom.notFound(`No addresses found for postcode ${postcode}`);
    }
    throw err;
  }
};

exports.searchForAddressesByPostcode = searchForAddressesByPostcode;
