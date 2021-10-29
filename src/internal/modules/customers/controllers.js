const services = require('../../../internal/lib/connectors/services');
const { uniqBy, omit, omitBy, isEmpty } = require('lodash');
const { logger } = require('../../logger');
const helpers = require('./helpers');
const session = require('./session');
const forms = require('./forms');
const formsHelper = require('shared/lib/forms');
const formHandler = require('shared/lib/form-handler');
const { hasScope } = require('../../lib/permissions');
const { hofNotifications } = require('../../lib/constants').scope;

const getCustomer = async (request, h) => {
  const { companyId } = request.params;
  const { newContactKey } = request.query;

  if (newContactKey) {
    return helpers.handleNewContact(request, h);
  }

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
  const hasPermissionToManageContacts = hasScope(request, [hofNotifications]);

  return h.view('nunjucks/customers/view.njk', {
    ...request.view,
    pageTitle: company.name,
    company,
    hasPermissionToManageContacts,
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

const getCustomerContact = async (request, h) => {
  const { companyId, contactId } = request.params;

  const company = await services.water.companies.getCompany(companyId);
  const { data: companyContacts } = await services.water.companies.getContacts(companyId);
  const companyContact = companyContacts.find(row => row.contact.id === contactId);
  const contactName = helpers.parseContactName(companyContact.contact);

  return h.view('nunjucks/customers/contact.njk', {
    ...request.view,
    pageTitle: `Manage contact settings for ${contactName}`,
    caption: company.name,
    back: `/customer/${companyId}`,
    contactName,
    companyContact
  });
};

const getUpdateCustomerContactName = async (request, h) => {
  const { companyId, contactId } = request.params;
  const company = await services.water.companies.getCompany(companyId);
  const caption = company.name;
  const { data: companyContacts } = await services.water.companies.getContacts(companyId);
  const companyContact = companyContacts.find(row => row.contact.id === contactId);

  session.merge(request, {
    contactFromDatabase: companyContact.contact
  });

  const pageTitle = `Enter a name`;
  const { path } = request;

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    back: path.replace(/\/[^/]*$/, ''),
    form: formHandler.handleFormRequest(request, forms.contact)
  });
};

const postUpdateCustomerContactName = async (request, h) => {
  const { contactId } = request.params;
  const form = await formHandler.handleFormRequest(request, forms.contact);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  // Retrieve contact data but remember that the back end knows the title as salutation
  const { title, ...data } = {
    ...omit(omitBy(formsHelper.getValues(form), isEmpty), 'csrf_token')
  };

  data.salutation = title;

  await services.water.contacts.patchContact(contactId, data);

  // eslint-disable-next-line no-useless-escape
  return h.redirect(request.path.replace(/\/[^\/]*$/, ''));
};

const getAddCustomerContactEmail = async (request, h) => {
  const { companyId, contactId } = request.params;
  const company = await services.water.companies.getCompany(companyId);
  const caption = company.name;
  const { data: companyContacts } = await services.water.companies.getContacts(companyId);
  const companyContact = companyContacts.find(row => row.contact.id === contactId);
  const contactName = helpers.parseContactName(companyContact.contact);

  session.merge(request, {
    waterAbstractionAlertsEnabledValueFromDatabase: companyContact.waterAbstractionAlertsEnabled,
    emailAddressFromDatabase: companyContact.contact.email
  });

  const pageTitle = `Enter an email address for ${contactName}`;
  const { path } = request;

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    back: path.replace(/\/[^/]*$/, ''),
    form: formHandler.handleFormRequest(request, forms.emailAddress)
  });
};

const postAddCustomerContactEmail = async (request, h) => {
  const { companyId, contactId } = request.params;
  const form = await formHandler.handleFormRequest(request, forms.emailAddress);
  const { data: companyContacts } = await services.water.companies.getContacts(companyId);
  const companyContact = companyContacts.find(row => row.contact.id === contactId);
  const company = await services.water.companies.getCompany(companyId);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  const email = form.fields.find(field => field.name === 'email').value;
  const isNew = form.fields.find(field => field.name === 'isNew').value;

  await services.water.contacts.patchContact(contactId, { email });

  if (isNew) {
    return h.view('nunjucks/customers/contact-added.njk', {
      ...request.view,
      contactName: helpers.parseContactName(companyContact.contact),
      contactId: contactId,
      company
    });
  }
  // eslint-disable-next-line no-useless-escape
  return h.redirect(request.path.replace(/\/[^\/]*$/, ''));
};

const getUpdateCustomerWaterAbstractionAlertsPreferences = async (request, h) => {
  const { companyId, contactId } = request.params;
  const company = await services.water.companies.getCompany(companyId);
  const caption = company.name;
  const { data: companyContacts } = await services.water.companies.getContacts(companyId);
  const companyContact = companyContacts.find(row => row.contact.id === contactId);
  const contactName = helpers.parseContactName(companyContact.contact);

  session.merge(request, {
    waterAbstractionAlertsEnabledValueFromDatabase: companyContact.waterAbstractionAlertsEnabled
  });

  const pageTitle = `Should ${contactName} get water abstraction email alerts?`;
  const { path } = request;

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    back: path.replace(/\/[^/]*$/, ''),
    form: formHandler.handleFormRequest(request, forms.waterAbstractionAlertsPreference)
  });
};

const postUpdateCustomerWaterAbstractionAlertsPreferences = async (request, h) => {
  const { companyId, contactId } = request.params;
  const form = await formHandler.handleFormRequest(request, forms.waterAbstractionAlertsPreference);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  const waterAbstractionAlertsEnabled = form.fields.find(field => field.name === 'waterAbstractionAlertsEnabled').value;
  await services.water.companies.patchCompanyContact(companyId, contactId, { waterAbstractionAlertsEnabled });

  const { data: companyContacts } = await services.water.companies.getContacts(companyId);
  const companyContact = companyContacts.find(row => row.contact.id === contactId);

  if (waterAbstractionAlertsEnabled && !companyContact.contact.email) {
    // eslint-disable-next-line no-useless-escape
    return h.redirect(request.path.replace(/\/[^\/]*$/, '/email'));
  }

  // eslint-disable-next-line no-useless-escape
  return h.redirect(request.path.replace(/\/[^\/]*$/, ''));
};

const getCreateCompanyContact = async (request, h) => {
  const { companyId } = request.params;
  const company = await services.water.companies.getCompany(companyId);
  const caption = company.name;

  const key = `newCompanyContact.${request.params.companyId}.${request.defra.userId}`;

  const path = request.contactEntryRedirect({
    companyId,
    caption,
    key,
    back: `/customer/${request.params.companyId}`,
    redirectPath: `/customer/${request.params.companyId}?newContactKey=${key}`,
    disableExistingContactSelection: true
  });
  return h.redirect(path);
};

exports.getCustomer = getCustomer;
exports.getCustomerContact = getCustomerContact;
exports.getUpdateCustomerContactName = getUpdateCustomerContactName;
exports.postUpdateCustomerContactName = postUpdateCustomerContactName;
exports.getAddCustomerContactEmail = getAddCustomerContactEmail;
exports.postAddCustomerContactEmail = postAddCustomerContactEmail;
exports.getUpdateCustomerWaterAbstractionAlertsPreferences = getUpdateCustomerWaterAbstractionAlertsPreferences;
exports.postUpdateCustomerWaterAbstractionAlertsPreferences = postUpdateCustomerWaterAbstractionAlertsPreferences;
exports.getCreateCompanyContact = getCreateCompanyContact;
