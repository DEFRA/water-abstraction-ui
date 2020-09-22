'use strict';

const Boom = require('boom');
const { partial } = require('lodash');
const dataService = require('./services/data-service');

const { water } = require('../../lib/connectors/services');
const tempId = '00000000-0000-0000-0000-000000000000';

const getDisplayedCompany = async (request) => {
  const session = dataService.sessionManager(request, request.params.regionId, request.params.companyId);
  if (session.agent) {
    if (session.agent.id !== tempId) {
      return water.companies.getCompany(session.agent.id);
    } else {
      return session.agent;
    }
  } else {
    return water.companies.getCompany(request.params.companyId);
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

exports.getCompany = getCompany;
exports.loadCompany = partial(preHandler, config.loadCompany);
exports.getDisplayedCompany = getDisplayedCompany;
