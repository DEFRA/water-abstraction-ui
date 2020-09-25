const Boom = require('@hapi/boom');
const services = require('../../lib/connectors/services');
const sessionHelper = require('shared/lib/session-helpers');

const searchForCompaniesByString = async request => {
  const { searchQuery } = request.payload || request.query;
  try {
    const data = await services.water.companies.getCompaniesByName(searchQuery);
    return data;
  } catch (err) {
    if (err.statusCode === 404) {
      return Boom.notFound(`No contacts found matching the search query "${searchQuery}"`);
    }
    throw err;
  }
};

const searchForCompaniesInCompaniesHouse = async request => {
  const { sessionKey } = request.payload || request.query;
  const { companyNameOrNumber } = await sessionHelper.saveToSession(request, sessionKey);
  if (!companyNameOrNumber) {
    return [];
  } else {
    // Search companies house. Return results as array;
    const { data } = await services.water.companies.getCompaniesFromCompaniesHouse(companyNameOrNumber);
    // Store results in yar, so that we can retrieve the results again later for address selection
    return data;
  }
};

const returnCompanyAddressesFromCompaniesHouse = async request => {
  const { sessionKey } = request.payload || request.query;
  const { selectedCompaniesHouseNumber } = await sessionHelper.saveToSession(request, sessionKey);
  if (!selectedCompaniesHouseNumber) {
    return [];
  } else {
    // Search companies house. Return results as array;
    const { data } = await services.water.companies.getCompaniesFromCompaniesHouse(selectedCompaniesHouseNumber);
    // Compile the addresses array and the main address object into a single array
    const addressArray = [...data[0].company.companyAddresses, data[0].address];
    // Store results in yar, so that we can retrieve the results again later for address selection
    return addressArray;
  }
};

exports.searchForCompaniesByString = searchForCompaniesByString;
exports.searchForCompaniesInCompaniesHouse = searchForCompaniesInCompaniesHouse;
exports.returnCompanyAddressesFromCompaniesHouse = returnCompanyAddressesFromCompaniesHouse;
