'use strict';

/**
 * @module shared pre-handlers for loading company data
 */

const { uniqBy } = require('lodash');
const { errorHandler } = require('./lib/error-handler');

/**
 * Loads a company from the water service using the companyId
 * which can be passed in or retrieved from the request object
 * @param {Object} request
 * @param {String} companyId guid, if provided
 */
const loadCompany = async (request, h, companyId = null) => {
  const id = companyId || request.params.companyId;
  try {
    return request.services.water.companies.getCompany(id);
  } catch (err) {
    return errorHandler(err, `Company not found for companyId: ${id}`);
  }
};

/**
 * Loads contacts for a company from the water service using the
 * companyId and passes back an array of unique contacts
 * @param {Object} request
 * @param {String} companyId guid, if provided
 */
const loadCompanyContacts = async (request, h, companyId = null) => {
  const id = companyId || request.params.companyId;
  try {
    const { data } = await request.services.water.companies.getContacts(id);
    return uniqBy(data.map(row => row.contact), 'id');
  } catch (err) {
    return errorHandler(err, `Company contacts not found for companyId: ${id}`);
  }
};

exports.loadCompany = loadCompany;
exports.loadCompanyContacts = loadCompanyContacts;
