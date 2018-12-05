'use strict';

const { getUserData, setUserData } = require('../../lib/user-data.js');

const VIEW_CONTACT_INFO = 'water/contact-details/contact-information';
const PAGE_TITLE = 'Contact information';

const getUserId = request => request.auth.credentials.user_id;

const payloadToContactDetails = payload => {
  return {
    name: payload['contact-name'],
    jobTitle: payload['contact-job-title'],
    tel: payload['contact-tel'],
    email: payload['contact-email'],
    address: payload['contact-address']
  };
};

const mapFormErrors = errors => ({
  contactEmail: errors['contact-email_email']
});

const getContactInformation = async (request, h) => {
  const viewContext = request.view;
  const userData = await getUserData(getUserId(request));
  viewContext.contactDetails = userData.contactDetails;
  viewContext.pageTitle = PAGE_TITLE;
  return h.view(VIEW_CONTACT_INFO, viewContext);
};

const postContactInformation = async (request, h) => {
  if (request.formError) {
    const contactDetails = payloadToContactDetails(request.payload);
    const viewContext = {
      ...request.view,
      error: mapFormErrors(request.view.errors),
      pageTitle: PAGE_TITLE,
      contactDetails
    };
    return h.view(VIEW_CONTACT_INFO, viewContext);
  }

  const userData = await getUserData(getUserId(request));
  userData.contactDetails = payloadToContactDetails(request.view.payload);

  await setUserData(getUserId(request), userData);
  return h.redirect('/');
};

module.exports = {
  getContactInformation,
  postContactInformation
};
