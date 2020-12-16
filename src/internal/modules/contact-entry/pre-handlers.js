const Boom = require('@hapi/boom');
const session = require('./lib/session');
const companyPreHandlers = require('shared/lib/pre-handlers/companies');

const getSessionDataFromRequest = request => {
  const { key } = request.params;
  return session.get(request, key);
};

const getSessionData = request => {
  const data = getSessionDataFromRequest(request);
  return data || Boom.notFound(`Session data not found for ${request.params.key}`);
};

const loadCompany = async (request, h) => {
  const { companyId } = getSessionDataFromRequest(request);
  return companyPreHandlers.loadCompany(request, h, companyId);
};

const loadCompanyContacts = async (request, h) => {
  const { companyId } = getSessionDataFromRequest(request);
  return companyPreHandlers.loadCompanyContacts(request, h, companyId);
};

exports.getSessionData = getSessionData;
exports.loadCompany = loadCompany;
exports.loadCompanyContacts = loadCompanyContacts;
