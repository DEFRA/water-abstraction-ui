const services = require('../../../internal/lib/connectors/services');
const { uniqBy } = require('lodash');
const { logger } = require('../../logger');

const getCustomer = async (request, h) => {
  const { companyId } = request.params;

  const company = await services.water.companies.getCompany(companyId);
  const { data: invoiceAccounts } = await services.water.companies.getCompanyInvoiceAccounts(companyId);
  const { data: crmLicences } = await services.water.companies.getCompanyLicences(companyId);

  const licences = await Promise.all(crmLicences.map(async crmLicence => {
    const thisLicence = await services.water.licences.getLicenceByLicenceNumber(crmLicence.documentRef);
    try {
      const { document_name: documentName } = await services.crm.documents.getWaterLicence(crmLicence.documentRef);
      thisLicence.name = documentName;
      return thisLicence;
    } catch (e) {
      return logger.info('Could not fetch a licence from the CRM', e);
    }
  }));

  const { data: contacts } = await services.water.companies.getContacts(companyId);

  return h.view('nunjucks/customers/view.njk', {
    ...request.view,
    pageTitle: company.name,
    company,
    contacts: uniqBy(contacts, 'id'),
    licences: uniqBy(licences, 'id'),
    invoiceAccounts: uniqBy(invoiceAccounts.map(eachInvoiceAccount => {
      eachInvoiceAccount.currentAddress = eachInvoiceAccount.invoiceAccountAddresses.find(address => address.dateRange.endDate === null);
      return eachInvoiceAccount;
    }), 'id'),
    caption: 'Customer',
    back: '/licences'
  });
};

exports.getCustomer = getCustomer;
