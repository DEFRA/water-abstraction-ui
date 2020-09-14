const dataService = require('../services/data-service');
const forms = require('shared/lib/forms');
const { has, isEmpty } = require('lodash');
const titleCase = require('title-case');
const tempId = '00000000-0000-0000-0000-000000000000';
const queryString = require('querystring');
const uuid = require('uuid/v4');

const getFormTitleCaption = (licenceNumber) => {
  return licenceNumber ? `Licence ${licenceNumber}` : '';
};

const processCompanyFormData = (request, regionId, companyId, formData) => {
  const { selectedCompany, companySearch } = forms.getValues(formData);
  if (selectedCompany === 'company_search') {
    const tempUuid = uuid();
    const queryTail = queryString.stringify({
      sessionKey: tempUuid,
      searchQuery: companySearch,
      regionId: regionId,
      back: `/invoice-accounts/create/${regionId}/${companyId}`
    });
    return `/contact-entry/select-contact?${queryTail}`;
  } else {
    const agentId = selectedCompany === companyId ? null : selectedCompany;
    dataService.sessionManager(request, regionId, companyId, { agent: agentId });
    return `/invoice-accounts/create/${regionId}/${companyId}/select-address`;
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
    const addresses = await dataService.getCompanyAddresses(companyId);
    const selectedAddress = addresses.find(address => (address.id === session.address.addressId));
    return selectedAddress;
  };
};

const getAgentCompany = (session) => {
  if (has(session, 'agent')) {
    return session.agent.companyId === tempId ? session.agent : dataService.getCompany(session.agent.companyId);
  } else { return null; }
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
exports.getContactName = getContactName;
exports.getFormTitleCaption = getFormTitleCaption;
exports.getAgentCompany = getAgentCompany;
exports.getSelectedAddress = getSelectedAddress;
exports.processFaoFormData = processFaoFormData;
exports.processCompanyFormData = processCompanyFormData;
exports.processSelectContactFormData = processSelectContactFormData;
