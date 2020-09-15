const Boom = require('@hapi/boom');
const services = require('../../lib/connectors/services');

const searchForCompaniesByString = async request => {
  const { searchQuery } = request.query;
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

const searchForAddressesByEntityId = async request => {
  const { sessionKey } = request.payload || request.query;
  const { id } = request.yar.get(sessionKey);
  try {
    const data = await services.water.companies.getAddresses(id);
    return data;
  } catch (err) {
    if (err.statusCode === 404) {
      return Boom.notFound(`No address found.`);
    }
    throw err;
  }
};

const searchForCompaniesInCompaniesHouse = async request => {
  let sessionKey = request.query.sessionKey ? request.query.sessionKey : request.payload.sessionKey;
  const { companyNameOrNumber } = request.yar.get(sessionKey);
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
  let sessionKey = request.query.sessionKey ? request.query.sessionKey : request.payload.sessionKey;
  const { selectedCompaniesHouseNumber } = request.yar.get(sessionKey);
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

const persistCompanyInDatabase = async request => {
  const sessionKey = request.query.sessionKey ? request.query.sessionKey : request.payload.sessionKey;
  const currentState = request.yar.get(sessionKey);
  if (currentState.newCompany) {
    let payload = {
      name: currentState.accountType === 'organisation' ? currentState.selectedCompaniesHouseCompanyName : currentState.personFullName,
      type: currentState.accountType,
      companyNumber: currentState.accountType === 'organisation' ? currentState.selectedCompaniesHouseNumber : null,
      organisationType: currentState.accountType === 'organisation' ? currentState.organisationType : null
    };
    const company = await services.water.companies.postCompany(payload);
    return company.companyId;
  } else {
    return currentState.id;
  }
};

exports.searchForCompaniesByString = searchForCompaniesByString;
exports.searchForAddressesByEntityId = searchForAddressesByEntityId;
exports.searchForCompaniesInCompaniesHouse = searchForCompaniesInCompaniesHouse;
exports.returnCompanyAddressesFromCompaniesHouse = returnCompanyAddressesFromCompaniesHouse;
exports.persistCompanyInDatabase = persistCompanyInDatabase;
