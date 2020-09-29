'use strict';

const Boom = require('boom');
const { partial } = require('lodash');
const dataService = require('./services/data-service');
const { has } = require('lodash');
const helpers = require('./lib/helpers');
const { water } = require('../../lib/connectors/services');

const loadCompanies = async (request) => {
  const { regionId, companyId } = request.params;
  const session = dataService.sessionManager(request, regionId, companyId);
  const agentCompany = await helpers.getAgentCompany(session);
  const originalCompany = await getCompany(request);

  return [agentCompany, originalCompany];
};

const loadBillingContact = async (request) => {
  const { regionId, companyId } = request.params;
  const session = dataService.sessionManager(request, regionId, companyId);
  if (has(session, 'agent.companyId')) {
    const agentCompany = await helpers.getAgentCompany(session);
    return agentCompany;
  } else {
    const originalCompany = await getCompany(request);
    return originalCompany;
  }
};

const getCompany = async (request) =>
  water.companies.getCompany(request.params.companyId);

const config = {
  loadCompany: {
    connector: getCompany,
    key: 'companyId',
    errorMessage: 'Company not found'
  }
};

const searchForCompaniesByString = async request => {
  const { filter } = request.payload || request.query;
  try {
    const data = await water.companies.getCompaniesByName(filter);
    return data;
  } catch (err) {
    throw err;
  }
};

/**
 * A default pre handler implementation which loads data using the supplied
 * function and resolves with it, throwing a Boom not found error if an error occurs
 * @param {Object} config
 * @param {Function} config.connector - an async function to retrieve data based on the request
 * @param {String} config.key - the key in request.params containing the ID to load
 * @param {String} config.errorMessage - an error message if data not found
 * @param {Object} request - HAPI request
 * @param {Object} h - HAPI response toolkit
 */
const preHandler = async (config, request, h) => {
  try {
    const response = await config.connector(request);
    return response;
  } catch (err) {
    const msg = `${config.errorMessage} for ${config.key}: ${request.params[config.key]}`;
    return Boom.notFound(msg);
  }
};

exports.loadCompanies = loadCompanies;
exports.loadCompany = partial(preHandler, config.loadCompany);
exports.loadBillingContact = loadBillingContact;
exports.searchForCompaniesByString = searchForCompaniesByString;
