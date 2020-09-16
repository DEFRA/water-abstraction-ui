'use-strict';

const sessionHelpers = require('shared/lib/session-helpers');
const services = require('../../../lib/connectors/services');
const { uniqBy } = require('lodash');
const tempId = '00000000-0000-0000-0000-000000000000';

const sessionManager = (request, regionId, companyId, data) => {
  const sessionKey = `newInvoiceAccountFlow.${regionId}.${companyId}`;
  return sessionHelpers.saveToSession(request, sessionKey, data);
};

const getCompany = async (companyId) => {
  const company = await services.water.companies.getCompany(companyId);
  return company;
};

const getCompanyAddresses = async (companyId, session) => {
  // Get addresses that belong to the company
  let responseArray = await services.water.companies.getAddresses(companyId);

  // Get the addresses that belong to the agent, if there is an agent
  let agentId = session.agent ? session.agent.id : null;
  if (agentId) {
    let agentAddresses = await services.water.companies.getAddresses(agentId);
    return uniqBy(responseArray.concat(agentAddresses).map(x => x.address), 'id')
  } else {
    return uniqBy(responseArray.map(x => x.address), 'id')
  }
};

const getCompanyContacts = async (companyId) => {
  const { data: contacts } = await services.water.companies.getContacts(companyId);
  const uniqueContacts = uniqBy(contacts.map(row => row.contact), 'id');
  return uniqueContacts;
};

const getLicenceById = async (licenceId) => {
  const licence = services.water.licences.getLicenceById(licenceId);
  return licence;
};

const saveInvoiceAccDetails = async (companyId, data) => {
  const invoiceAccId = await services.water.companies.postInvoiceAccount(companyId, data);
  return invoiceAccId;
};

exports.getLicenceById = getLicenceById;
exports.getCompanyAddresses = getCompanyAddresses;
exports.getCompany = getCompany;
exports.saveInvoiceAccDetails = saveInvoiceAccDetails;
exports.sessionManager = sessionManager;
exports.getCompanyContacts = getCompanyContacts;
