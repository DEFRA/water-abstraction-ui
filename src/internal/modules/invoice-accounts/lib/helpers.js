const dataService = require('../services/data-service');
const forms = require('shared/lib/forms');
const { has, assign, omit, isEmpty } = require('lodash');
const moment = require('moment');
const titleCase = require('title-case');
const tempId = '00000000-0000-0000-0000-000000000000';
const sessionHelper = require('shared/lib/session-helpers');
const { mapContactToString } = require('shared/lib/mappers/contact');

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
      // Store the selected agent name in the viewData object

      dataService.sessionManager(request, regionId, companyId, {
        viewData: assign({}, existingState.viewData, { companyName: titleCase(request.pre.companies.find(x => x.id === selectedCompany).name || 'the agent') }),
        agent: assign({}, existingState.agent, { companyId: agentId })
      });
    } else {
      dataService.sessionManager(request, regionId, companyId, { agent: null });
    }
    return 'select-address';
  }
};

const getSelectedAddress = async (companyId, session) => {
  const { address } = session;
  if (address.id) {
    const addresses = await getAllAddresses(companyId, session);
    return addresses.find(row => (row.id === address.id));
  }
  return address;
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

const isTempGuid = id => id === tempId;

/**
 * Maps the address data stored in the session to a shape expected
 * by the water service endpoint
 * @param {Object} address
 * @return {Object}
 */
const mapAddressFromSession = address => {
  const addressId = address.id || address.addressId;

  // If a valid ID is present, send this only
  if (addressId && !isTempGuid(addressId)) {
    return { addressId };
  }

  // Otherwise send the address excluding the temp ID
  return omit(address, 'id', 'addressId');
};

const postDataHandler = (request) => {
  const { regionId, companyId } = request.params;
  const session = dataService.sessionManager(request, regionId, companyId);
  // Create the request body object
  let requestBody = {};
  // TODO default start date added here - might need to create a screen for the user to select a date
  requestBody['startDate'] = moment().format('YYYY-MM-DD');
  requestBody['regionId'] = regionId; // Stuff the regionId into the request body

  requestBody.address = mapAddressFromSession(session.address);

  requestBody['agent'] = session.agent; // Stuff the agent into the request body
  // If the agent is a temp/new one, we remove the ID from the request
  if (requestBody.agent && requestBody.agent.id === tempId) {
    delete requestBody.agent.id;
    delete requestBody.agent.companyId;
    // If the company number is not a valid 8-long string, remove it
    if (!requestBody.agent.companyNumber || requestBody.agent.companyNumber.length !== 8) {
      delete requestBody.agent.companyNumber;
    }
  }
  requestBody['contact'] = session.contact; // Stuff the contact into the request body
  return requestBody;
};

const getFlowKey = request => `new-invoice-account-${request.params.companyId}`;

const getSelectedContact = (session, companyContacts) => {
  if (isEmpty(session.contact)) return 'No';
  const { contactId } = session.contact;
  const contact = contactId
    ? companyContacts.find(contact => contact.id === contactId)
    : session.contact;

  return mapContactToString(contact);
};

exports.getCompanyName = getCompanyName;
exports.getFormTitleCaption = getFormTitleCaption;
exports.getAllAddresses = getAllAddresses;
exports.getAgentCompany = getAgentCompany;
exports.getSelectedAddress = getSelectedAddress;
exports.processCompanyFormData = processCompanyFormData;
exports.processContactEntry = processContactEntry;
exports.postDataHandler = postDataHandler;
exports.getFlowKey = getFlowKey;
exports.getSelectedContact = getSelectedContact;
