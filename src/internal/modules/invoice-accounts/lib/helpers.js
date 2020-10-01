const dataService = require('../services/data-service');
const forms = require('shared/lib/forms');
const { has, isEmpty } = require('lodash');
const moment = require('moment');
const titleCase = require('title-case');
const tempId = '00000000-0000-0000-0000-000000000000';
const sessionHelper = require('shared/lib/session-helpers');

const getFormTitleCaption = (licenceNumber) => {
  return licenceNumber ? `Licence ${licenceNumber}` : '';
};

const processCompanyFormData = (request, regionId, companyId, formData) => {
  const { selectedCompany, companySearch } = forms.getValues(formData);
  if (selectedCompany === 'company_search') {
    return `contact-search?filter=${companySearch}`;
  } else {
    const agentId = selectedCompany === companyId ? null : selectedCompany;
    if (agentId) {
      const existingState = dataService.sessionManager(request, regionId, companyId);
      dataService.sessionManager(request, regionId, companyId, { agent: { ...existingState.agent, companyId: agentId } });
    } else {
      dataService.sessionManager(request, regionId, companyId, { agent: null });
    }
    return 'select-address';
  }
};

/**
 * Identifies redirction route after addFao and saves empty
 * contact in session if no FAO contact should be added
 * @param {*} request Hapi request object
 * @param {*} regionId
 * @param {*} companyId
 * @param {*} addFao - value selected in addFao form
 * @returns redirection route
 */
const processFaoFormData = (request, regionId, companyId, addFao) => {
  if (addFao === 'yes') {
    return 'select-contact';
  } else {
    dataService.sessionManager(request, regionId, companyId, { contact: null });
    return 'check-details';
  }
};

const processSelectContactFormData = (request, regionId, companyId, selectedContact, department) => {
  const session = dataService.sessionManager(request, regionId, companyId);
  if (has(session, 'contact')) { dataService.sessionManager(request, regionId, companyId, { contact: null }); }
  // if it is a new department contact
  if (selectedContact === 'department') {
    dataService.sessionManager(request, regionId, companyId, { contact: { type: 'department', department } });
  } else {
    // if the contact exist then save the contact id
    dataService.sessionManager(request, regionId, companyId, { contact: { contactId: selectedContact } });
  };
};

const getSelectedAddress = async (companyId, session) => {
  if (session.address.addressId === tempId) {
    return session.address;
  } else {
    const addresses = await getAllAddresses(companyId, session);
    const selectedAddress = addresses.find(address => (address.id === session.address.addressId));
    return selectedAddress;
  };
};

const getAllAddresses = async (companyId, session) => {
  let originalCompanyAddresses = await dataService.getCompanyAddresses(companyId) || [];
  let agentCompanyAddresses = has(session, 'agent.companyId') && session.agent.companyId !== '00000000-0000-0000-0000-000000000000' ? await dataService.getCompanyAddresses(session.agent.companyId) : [] || [];
  let newAddressFromSession = {};

  if (has(session, 'address.id')) {
    if (session.address.addressId === tempId) {
      newAddressFromSession = session.address;
    }
  }

  const compiledArrays = [...originalCompanyAddresses, ...agentCompanyAddresses, newAddressFromSession];
  const filteredArray = compiledArrays.filter(obj => obj.id);
  return filteredArray;
};

const getAgentCompany = async (session) => {
  if (session.agent && session.agent.companyId) {
    const outcome = session.agent.companyId === tempId ? session.agent : await dataService.getCompany(session.agent.companyId);
    return outcome;
  } else { return null; }
};

const getCompanyName = async (request) => {
  const { sessionKey } = request.query;
  const { companyId } = request.params;
  let currentState = await request.yar.get(sessionKey);
  if (currentState.newCompany) {
    return currentState.agent.name;
  } else {
    const originalCompany = await dataService.getCompany(companyId);
    return originalCompany.name;
  }
};

const getName = (contact) => {
  const name = [
    contact.title,
    contact.firstName,
    contact.middleInitials,
    contact.lastName,
    contact.suffix
  ].filter(item => !isEmpty(item)).join(' ');
  if (!isEmpty(contact.department) && !isEmpty(name)) {
    return [titleCase(name), titleCase(contact.department)].join(', ');
  } else {
    return isEmpty(contact.department) ? titleCase(name) : titleCase(contact.department);
  }
};

const getContactName = async (companyId, sessionContact) => {
  if (sessionContact.type === 'person') {
    const name = getName(sessionContact);
    return name;
  } else if (sessionContact.type === 'department') {
    return titleCase(sessionContact.department);
  } else {
    const contacts = await dataService.getCompanyContacts(companyId);
    const contact = contacts.find(contact => contact.id === sessionContact.contactId);
    const name = getName(contact);
    return name;
  }
};

const processContactEntry = async (request) => {
  const { regionId, companyId } = request.params;
  const companyName = titleCase(await getCompanyName(request));
  const originalSessionData = await dataService.sessionManager(request, regionId, companyId);
  let response = { viewData: originalSessionData.viewData || {} }; // Store everything in the right bits of the session
  response['viewData']['companyName'] = companyName;
  const { sessionKey } = request.query;
  const currentState = await sessionHelper.saveToSession(request, sessionKey);
  if (currentState.agent.companyId === companyId) { // This if-statement helps the controller avoid creating an 'agent' object if the selected company ID happens to be the same as the originating company
    response['agent'] = null;
  } else {
    let tempType;
    if (currentState.organisationType) {
      tempType = currentState.organisationType;
    } else {
      tempType = 'individual';
    }
    response['agent'] = {
      id: currentState.id ? currentState.id : tempId,
      companyId: currentState.id ? currentState.id : tempId,
      name: companyName,
      type: tempType,
      companyNumber: currentState.selectedCompaniesHouseNumber ? currentState.selectedCompaniesHouseNumber : null
    };
  }
  response['address'] = {
    id: currentState.addressId ? currentState.addressId : tempId,
    addressId: currentState.addressId ? currentState.addressId : tempId,
    country: currentState.address.country ? currentState.address.country : 'UK',
    ...currentState.address
  };
  return response;
};

const postDataHandler = (request) => {
  const { regionId, companyId } = request.params;
  const session = dataService.sessionManager(request, regionId, companyId);
  // Create the request body object
  let requestBody = {};
  // TODO default start date added here - might need to create a screen for the user to select a date
  requestBody['startDate'] = moment().format('YYYY-MM-DD');
  requestBody['regionId'] = regionId; // Stuff the regionId into the request body
  requestBody['address'] = session.address; // Stuff the address into the request body
  // If the address is a temp/new one, we remove the ID from the request
  if (requestBody.address.id === tempId) {
    delete requestBody.address.id;
    delete requestBody.address.addressId;
  }
  delete requestBody.address.dataSource; // Remove the data source property from the address object
  // Remove properties from the address sub-object where there is no corresponding value
  Object.entries(requestBody.address).map(eachProperty => {
    if (eachProperty[1].length === 0) {
      delete requestBody.address[eachProperty[0]];
    }
  });
  requestBody['agent'] = session.agent; // Stuff the agent into the request body
  // If the agent is a temp/new one, we remove the ID from the request
  if (requestBody.agent.id === tempId) {
    delete requestBody.agent.id;
    delete requestBody.agent.companyId;
  }
  // If the company number is not a valid 8-long string, remove it
  if (!requestBody.agent.companyNumber || requestBody.agent.companyNumber.length !== 8) {
    delete requestBody.agent.companyNumber;
  }
  requestBody['contact'] = session.contact; // Stuff the contact into the request body
  return requestBody;
};

exports.getName = getName;
exports.getCompanyName = getCompanyName;
exports.getContactName = getContactName;
exports.getFormTitleCaption = getFormTitleCaption;
exports.getAllAddresses = getAllAddresses;
exports.getAgentCompany = getAgentCompany;
exports.getSelectedAddress = getSelectedAddress;
exports.processFaoFormData = processFaoFormData;
exports.processCompanyFormData = processCompanyFormData;
exports.processSelectContactFormData = processSelectContactFormData;
exports.processContactEntry = processContactEntry;
exports.postDataHandler = postDataHandler;
