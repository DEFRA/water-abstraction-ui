const Boom = require('@hapi/boom');
const services = require('../../lib/connectors/services');

const searchForCompaniesByString = async request => {
  const { searchQuery } = request.query;
  try {
    const data = services.water.companies.getCompaniesByName(searchQuery);
    return data;
  } catch (err) {
    if (err.statusCode === 404) {
      return Boom.notFound(`No contacts found matching the search query "${searchQuery}"`);
    }
    throw err;
  }
};

const searchForAddressesByEntityId = async request => {
  let sessionKey = request.query.sessionKey ? request.query.sessionKey : request.payload.sessionKey;
  const { id } = request.yar.get(sessionKey);
  try {
    const data = await services.water.companies.getAddresses(id);
    return data;
  } catch (err) {
    if (err.statusCode === 404) {
      return Boom.notFound(`No address found.`);
    }
    throw err;
  }
};

const searchForFAOsByEntityId = async request => {
  let sessionKey = request.query.sessionKey ? request.query.sessionKey : request.payload.sessionKey;

  const { id } = request.yar.get(sessionKey);
  try {
    const { data } = await services.water.companies.getContacts(id);
    return data;
  } catch (err) {
    if (err.statusCode === 404) {
      return Boom.notFound(`No address found.`);
    }
    throw err;
  }
}

exports.searchForCompaniesByString = searchForCompaniesByString;
exports.searchForAddressesByEntityId = searchForAddressesByEntityId;
exports.searchForFAOsByEntityId = searchForFAOsByEntityId;
