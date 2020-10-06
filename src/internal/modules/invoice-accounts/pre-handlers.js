'use strict';

const dataService = require('./services/data-service');
const helpers = require('./lib/helpers');
const { water } = require('../../lib/connectors/services');

const loadCompanies = async (request) => {
  const { regionId, companyId } = request.params;
  const session = dataService.sessionManager(request, regionId, companyId);
  const agentCompany = await helpers.getAgentCompany(session);
  const originalCompany = await getCompany(request);

  return [originalCompany, agentCompany];
};

const getCompany = async (request) =>
  water.companies.getCompany(request.params.companyId);

const searchForCompaniesByString = async request => {
  const { filter } = request.payload || request.query;
  try {
    const data = await water.companies.getCompaniesByName(filter);
    return data;
  } catch (err) {
    throw err;
  }
};

exports.loadCompanies = loadCompanies;
exports.searchForCompaniesByString = searchForCompaniesByString;
