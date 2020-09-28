const dataService = require('../services/data-service');
const forms = require('shared/lib/forms');
const { has, isEmpty } = require('lodash');
const titleCase = require('title-case');
const tempId = '00000000-0000-0000-0000-000000000000';

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
      dataService.sessionManager(request, regionId, companyId, { agent: { companyId: agentId } });
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
  let agentCompanyAddresses = has(session, 'agent.companyId') ? await dataService.getCompanyAddresses(session.agent.companyId) : [] || [];
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
  let currentState = await request.yar.get(sessionKey);
  if (currentState.newCompany) {
    return currentState.accountType === 'organisation' ? currentState.companyName : currentState.personFullName;
  } else {
    return currentState.companyName;
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
