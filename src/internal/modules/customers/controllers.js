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
  console.log(invoiceAccounts[0].invoiceAccountAddresses);

  return h.view('nunjucks/customers/view.njk', {
    ...request.view,
    pageTitle: company.name,
    company,
    licences,
    invoiceAccounts: invoiceAccounts.map(eachInvoiceAccount => {
      eachInvoiceAccount.currentAddress = eachInvoiceAccount.invoiceAccountAddresses.find(address => address.dateRange.endDate === null);
    }),
    caption: 'Customer',
    back: '/licences'
  });
};

exports.getCustomer = getCustomer;
