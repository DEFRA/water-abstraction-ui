const services = require('../../../internal/lib/connectors/services');

const getCustomer = async (request, h) => {
  const { companyId } = request.params;

  const company = await services.water.companies.getCompany(companyId);
  const { data: invoiceAccounts } = await services.water.companies.getCompanyInvoiceAccounts(companyId);
  const { data: crmLicences } = await services.water.companies.getCompanyLicences(companyId);

  const licences = await Promise.all(crmLicences.map(async crmLicence => {
    const thisLicence = await services.water.licences.getLicenceByLicenceNumber(crmLicence.documentRef);
    const { document_name: documentName } = await services.crm.documents.getWaterLicence(crmLicence.documentRef);
    thisLicence.name = documentName;
    return thisLicence;
  }));

  const { data: contacts } = await services.water.companies.getContacts(companyId);

  return h.view('nunjucks/customers/view.njk', {
    ...request.view,
    pageTitle: company.name,
    company,
    contacts,
    licences,
    invoiceAccounts: invoiceAccounts.map(eachInvoiceAccount => {
      eachInvoiceAccount.currentAddress = eachInvoiceAccount.invoiceAccountAddresses.find(address => address.dateRange.endDate === null);
      return eachInvoiceAccount;
    }),
    caption: 'Customer',
    back: '/licences'
  });
};

/* Purpose for contact email, e.g. WAA alerts */
const getContactPurpose = async (request, h) => {
  const { companyId, contactId } = request.params;
  let company = null;
  let userMessage = null;
  let contacts = [];
  let companyName = '';
  try {
    company = await services.water.companies.getCompany(companyId);
    const { data } = await services.water.companies.getContactPurpose(companyId, contactId);
    contacts = data;
    companyName = company.name;
  } catch (ex) {
    if (ex.statusCode === '500') {
      userMessage = 'Manage/Add contact settings';
    }
  }

  return h.view('nunjucks/customers/contact-purpose-view.njk', {
    ...request.view,
    pageTitle: companyName,
    company,
    companyId,
    contactId,
    contacts,
    caption: 'WAA Contact details',
    userMessage,
    back: '/'
  });
};

exports.getContactPurpose = getContactPurpose;
exports.getCustomer = getCustomer;
