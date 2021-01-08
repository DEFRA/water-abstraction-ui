'use strict';

const Boom = require('@hapi/boom');
const services = require('../../lib/connectors/services');
const session = require('./lib/session');

const getSessionDataFromRequest = request => {
  const { key } = request.params;
  return session.get(request, key);
};

const getSessionData = request => {
  const data = getSessionDataFromRequest(request);
  return data || Boom.notFound(`Session data not found for ${request.params.key}`);
};

const searchCRMCompanies = async request => {
  const { q } = request.query;
  return services.water.companies.getCompaniesByName(q);
};

const searchForCompaniesInCompaniesHouse = async request => {
  const { q } = request.query;

  if (!q) {
    return [];
  } else {
    // Search companies house. Return results as array;
    const { data } = await services.water.companies.getCompaniesFromCompaniesHouse(q);
    return data;
  }
};

exports.getSessionData = getSessionData;
exports.searchCRMCompanies = searchCRMCompanies;
exports.searchForCompaniesInCompaniesHouse = searchForCompaniesInCompaniesHouse;
