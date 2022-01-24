const ServiceClient = require('../ServiceClient');

class ContactsService extends ServiceClient {
  getContact (contactId) {
    const url = this.joinUrl('contact', contactId);
    return this.serviceRequest.get(url);
  }

  patchContact (contactId, payload) {
    const url = this.joinUrl('contact', contactId);
    return this.serviceRequest.patch(url, { body: payload });
  }

  postContact (payload, roleName) {
    const url = this.joinUrl('contacts');
    return this.serviceRequest.post(url, { body: { ...payload, roleName } });
  }
}
module.exports = ContactsService;
