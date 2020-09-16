'use-strict';

const sessionHelpers = require('shared/lib/session-helpers');
const services = require('../../../lib/connectors/services');
const { uniqBy } = require('lodash');

const sessionManager = (request, regionId, companyId, data) => {
  const sessionKey = `newInvoiceAccountFlow.${regionId}.${companyId}`;
  return sessionHelpers.saveToSession(request, sessionKey, data);
};

const getCompany = async (companyId) => {
  const company = await services.water.companies.getCompany(companyId);
  return company;
};

const getCompanyAddresses = async (companyId, session) => {
  const addresses = await services.water.companies.getAddresses(companyId);
  // If there is a new address stored in the session, as identified by a nonsensical GUID, append the address to the array of addresses
  const allAddresses = [...addresses || [], ...[session.address] || []];
  // get the unique list of addresses
  const uniqueAddresses = uniqBy(allAddresses.map(row => row.address), 'id');
  return uniqueAddresses;
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
