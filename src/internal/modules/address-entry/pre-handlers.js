'use strict';

const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const services = require('../../lib/connectors/services');
const session = require('./lib/session');
const postcodeValidator = require('./lib/postcode-validator');

/**
 * Retrieves addresses for the specified postcode,
 * or a Boom 404 error if not found
 * @param {String} request.query.postcode - postcode entered by user
 * @param {Promise<Array>}
 */
const searchForAddressesByPostcode = async request => {
  const { error, value: postcode } = Joi.validate(request.query.postcode, postcodeValidator.postcodeSchema);

  if (!error) {
    try {
      const { data } = await services.water.addressSearch.getAddressSearchResults(postcode);
      return data;
    } catch (err) {
      if (err.statusCode === 404) {
        return Boom.notFound(`No addresses found for postcode ${postcode}`);
      }
      throw err;
    }
  }
  return null;
};

const getSessionData = request => {
  const { key } = request.params;
  const data = session.get(request, key);
  return data || Boom.notFound(`Session data not found for ${key}`);
};

exports.searchForAddressesByPostcode = searchForAddressesByPostcode;
exports.getSessionData = getSessionData;
