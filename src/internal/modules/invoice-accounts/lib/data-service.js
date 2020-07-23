'use-strict';

const hoek = require('@hapi/hoek');
const services = require('../../../lib/connectors/services');

const sessionManager = (request, regionId, companyId, data = null) => {
  // get existing session data
  let sessionData = request.yar.get(`newInvoiceAccountFlow.${regionId}.${companyId}`);
  // merge the new with old data
  sessionData = hoek.merge(sessionData || {}, { ...data });
  // set the new session data
  request.yar.set(`newInvoiceAccountFlow.${regionId}.${companyId}`, sessionData);
  return sessionData;
};

const getCompany = async (companyId) => {
  const company = await services.water.companies.getCompany(companyId);
  return company;
};

const getCompanyAddresses = async (companyId) => {
  const companyAddresses = await services.water.companies.getAddresses(companyId);
  // get the unique list of addresses
  const uniqueIds = new Set(companyAddresses.map(row => row.address.id));
  const uniqueAddresses = Array.from(uniqueIds).map(id => {
    const { address } = companyAddresses.find(row => row.address.id === id);
    return address;
  });

  return uniqueAddresses;
};

const getLicenceById = async (licenceId) => {
  const licence = services.water.licences.getLicenceById(licenceId);
  return licence;
};

const saveInvoiceAccDetails = async (data) => {
  const entityId = data.companyId;
  delete data.companyId;
  const invoiceAccId = await services.water.companies.postInvoiceAccount(entityId, data);
  return invoiceAccId;
};

exports.getLicenceById = getLicenceById;
exports.getCompanyAddresses = getCompanyAddresses;
exports.getCompany = getCompany;
exports.saveInvoiceAccDetails = saveInvoiceAccDetails;
exports.sessionManager = sessionManager;
