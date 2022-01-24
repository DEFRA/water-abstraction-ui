const services = require('../../../internal/lib/connectors/services');
const { uniqBy, omit } = require('lodash');
const { logger } = require('../../logger');
const helpers = require('./helpers');
const session = require('./session');
const forms = require('./forms');
const formsHelper = require('shared/lib/forms');
const formHandler = require('shared/lib/form-handler');
const { hasScope } = require('../../lib/permissions');
const { addressSources, crmRoles } = require('shared/lib/constants');
const { hofNotifications, manageBillingAccounts } = require('../../lib/constants').scope;

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
  const hasPermissionToManageBillingAccounts = hasScope(request, [manageBillingAccounts]);

  return h.view('nunjucks/customers/view.njk', {
    ...request.view,
    pageTitle: company.name,
    company,
    hasPermissionToManageContacts,
    hasPermissionToManageBillingAccounts,
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
  const contactName = companyContact.contact.fullName;

  return h.view('nunjucks/customers/contact.njk', {
    ...request.view,
    pageTitle: `Manage contact settings for ${contactName}`,
    caption: company.name,
    back: `/customer/${companyId}#contacts`,
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

  const pageTitle = 'Enter a name';
  const { path } = request;

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    back: path.replace(/\/[^/]*$/, ''),
    form: formHandler.handleFormRequest(request, forms.name)
  });
};

const postUpdateCustomerContactName = async (request, h) => {
  const { contactId } = request.params;
  const form = await formHandler.handleFormRequest(request, forms.name);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  // Retrieve contact data but remember that the back end knows the title as salutation
  const { title, ...data } = {
    ...omit(formsHelper.getValues(form), 'csrf_token')
  };

  data.salutation = title;

  await services.water.contacts.patchContact(contactId, data);

  // eslint-disable-next-line no-useless-escape
  return h.redirect(request.path.replace(/\/[^\/]*$/, ''));
};

const getUpdateCustomerContactDepartment = async (request, h) => {
  const { companyId, contactId } = request.params;
  const company = await services.water.companies.getCompany(companyId);
  const caption = company.name;
  const { data: companyContacts } = await services.water.companies.getContacts(companyId);
  const companyContact = companyContacts.find(row => row.contact.id === contactId);

  session.merge(request, {
    departmentFromDatabase: companyContact.contact.department
  });

  const pageTitle = 'Enter a department';
  const { path } = request;

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    back: path.replace(/\/[^/]*$/, ''),
    form: formHandler.handleFormRequest(request, forms.department)
  });
};

const postUpdateCustomerContactDepartment = async (request, h) => {
  const { contactId } = request.params;
  const form = await formHandler.handleFormRequest(request, forms.department);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  const data = {
    ...omit(formsHelper.getValues(form), 'csrf_token')
  };

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
  const contactName = companyContact.contact.fullName;

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
      contactName: companyContact.contact.fullName,
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
  const contactName = companyContact.contact.fullName;

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

const getSelectRemoveCompanyContact = async (request, h) => {
  const { companyId } = request.params;
  const company = await services.water.companies.getCompany(companyId);
  const { data: companyContacts } = await services.water.companies.getContacts(companyId);

  const billingContactIds = [];
  const naldContactIds = [];

  companyContacts.forEach(companyContact => {
    const { role = {}, contact = {} } = companyContact;
    if (role.name === crmRoles.billing && !billingContactIds.includes(contact.id)) {
      billingContactIds.push(contact.id);
    }
    if (contact.dataSource === addressSources.nald && !naldContactIds.includes(contact.id)) {
      naldContactIds.push(contact.id);
    }
  });

  const companyContactsForRemoval = companyContacts
    .filter(({ role = {} }) => role.name === crmRoles.additionalContact)
    .map(({ contact, id }) => {
      return {
        name: contact.fullName,
        companyContactId: id
      };
    });

  session.merge(request, {
    companyId,
    companyContactsForRemoval: uniqBy(companyContactsForRemoval, 'companyContactId'),
    billingContactsExist: !!billingContactIds.length,
    naldContactsExist: !!naldContactIds.length
  });

  const pageTitle = companyContactsForRemoval.length ? 'Select which contact you would like to remove' : '';
  const caption = companyContactsForRemoval.length ? company.name : null;
  const { path } = request;

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    back: path.replace(/\/[^/]*$/, ''),
    form: formHandler.handleFormRequest(request, forms.selectContactForRemoval)
  });
};

const postSelectRemoveCompanyContact = async (request, h) => {
  const form = await formHandler.handleFormRequest(request, forms.selectContactForRemoval);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  const companyContactId = form.fields.find(field => field.name === 'companyContactId').value;

  session.merge(request, { companyContactId });

  // eslint-disable-next-line no-useless-escape
  return h.redirect(request.path + '/check');
};

const getCheckRemoveCompanyContact = async (request, h) => {
  const { companyId } = request.params;
  const company = await services.water.companies.getCompany(companyId);
  const { data: companyContacts } = await services.water.companies.getContacts(companyId);

  const { companyContactId } = session.get(request) || {};
  const companyContact = companyContacts.find(({ id }) => id === companyContactId);

  // If the deleted contact was the last remaining contact receiving email WAAs for the company, then the sending logic reverts to sending WAAs by letter to the licence holder.
  const contactsWithWaterAbstractionAlertsEnabled = companyContacts.filter(({ waterAbstractionAlertsEnabled }) => waterAbstractionAlertsEnabled);
  const isLastEmailContact = contactsWithWaterAbstractionAlertsEnabled.length === 1 && contactsWithWaterAbstractionAlertsEnabled[0].id === companyContactId;
  const contactName = companyContact.contact.fullName;
  const companyName = company.name;

  session.merge(request, { companyId, companyContactId, isLastEmailContact, contactName, companyName });

  const pageTitle = `You’re about to remove ${companyContact.contact.fullName} from ${company.name}`;
  const { path } = request;

  return h.view('nunjucks/form', {
    ...request.view,
    pageTitle,
    back: path.replace(/\/[^/]*$/, ''),
    form: formHandler.handleFormRequest(request, forms.checkContactForRemoval)
  });
};

const postCheckRemoveCompanyContact = async (request, h) => {
  const form = await formHandler.handleFormRequest(request, forms.checkContactForRemoval);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  const { companyId, companyContactId } = session.get(request) || {};

  await services.water.companies.deleteCompanyContact(companyId, companyContactId);

  return h.redirect(request.path.replace('/check', '/confirmation'));
};

const getConfirmationRemoveCompanyContact = async (request, h) => {
  const { companyId, contactName, companyName } = session.get(request) || {};

  return h.view('nunjucks/customers/contact-removed.njk', {
    ...request.view,
    companyId,
    confirmationMessage: `${contactName} is no longer a contact for ${companyName}`
  });
};

exports.getCustomer = getCustomer;
exports.getCustomerContact = getCustomerContact;
exports.getUpdateCustomerContactName = getUpdateCustomerContactName;
exports.postUpdateCustomerContactName = postUpdateCustomerContactName;
exports.getUpdateCustomerContactDepartment = getUpdateCustomerContactDepartment;
exports.postUpdateCustomerContactDepartment = postUpdateCustomerContactDepartment;
exports.getAddCustomerContactEmail = getAddCustomerContactEmail;
exports.postAddCustomerContactEmail = postAddCustomerContactEmail;
exports.getUpdateCustomerWaterAbstractionAlertsPreferences = getUpdateCustomerWaterAbstractionAlertsPreferences;
exports.postUpdateCustomerWaterAbstractionAlertsPreferences = postUpdateCustomerWaterAbstractionAlertsPreferences;
exports.getCreateCompanyContact = getCreateCompanyContact;
exports.getSelectRemoveCompanyContact = getSelectRemoveCompanyContact;
exports.postSelectRemoveCompanyContact = postSelectRemoveCompanyContact;
exports.getCheckRemoveCompanyContact = getCheckRemoveCompanyContact;
exports.postCheckRemoveCompanyContact = postCheckRemoveCompanyContact;
exports.getConfirmationRemoveCompanyContact = getConfirmationRemoveCompanyContact;
