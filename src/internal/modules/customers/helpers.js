const services = require('../../../internal/lib/connectors/services');

const parseContactName = contact => {
  if (contact.type === 'department') {
    return contact.department;
  }
  return `${contact.firstName || ''} ${contact.lastName || ''}`;
};

const handleNewContact = async (request, h) => {
  const contact = request.getNewContact(`newCompanyContact.${request.params.companyId}.${request.defra.userId}`);

  const parsedContact = { ...contact, salutation: contact.title };
  delete parsedContact.title;

  const persistedContactRecord = await services.water.contacts.postContact(parsedContact);
  await services.water.companies.postCompanyContact(request.params.companyId, persistedContactRecord.id, 'additionalContact');

  return h.redirect(`/customer/${request.params.companyId}/contacts/${persistedContactRecord.id}/email?isNew=1`);
};

exports.parseContactName = parseContactName;
exports.handleNewContact = handleNewContact;
