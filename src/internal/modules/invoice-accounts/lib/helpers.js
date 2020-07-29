const dataService = require('./data-service');
const forms = require('shared/lib/forms');
const { has } = require('lodash');

const tempId = '00000000-0000-0000-0000-000000000000';

const processCompanyFormData = (request, regionId, companyId, formData) => {
  const { selectedCompany, companySearch } = forms.getValues(formData);
  if (selectedCompany === 'company_search') {
    // TODO place holder -- route does not exist
    return `company-search?filter=${companySearch}`;
  } else {
    const agentId = selectedCompany === companyId ? null : selectedCompany;
    dataService.sessionManager(request, regionId, companyId, { agent: agentId });
    return 'select-address';
  }
};

const processFaoFormData = (request, regionId, companyId, addFao) => {
  if (addFao === 'yes') {
    // TODO path does not exist
    return 'search-contact';
  } else {
    dataService.sessionManager(request, regionId, companyId, { contact: null });
    return 'check-details';
  }
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

exports.getAgentCompany = getAgentCompany;
exports.getSelectedAddress = getSelectedAddress;
exports.processFaoFormData = processFaoFormData;
exports.processCompanyFormData = processCompanyFormData;
