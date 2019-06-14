'use strict';

const { handleRequest } = require('shared/lib/forms');
const { setUserData } = require('../../lib/user-data');
const { contactDetailsForm, contactDetailsSchema } = require('./contact-details-form');

const payloadToContactDetails = payload => {
  const { name, jobTitle, tel, email, address } = payload;
  return { name, jobTitle, tel, email, address };
};

const getContactFormView = (h, viewContext, form) => {
  return h.view('nunjucks/form.njk', {
    ...viewContext,
    form
  }, { layout: false });
};

const getContactInformation = async (request, h) => {
  const { contactDetails } = request.defra.user.user_data;
  const { view } = request;
  return getContactFormView(h, view, contactDetailsForm(request, contactDetails));
};

const postContactInformation = async (request, h) => {
  const { view, payload } = request;
  const form = handleRequest(contactDetailsForm(request, payload), request, contactDetailsSchema);

  if (form.isValid) {
    const { user_id: userId, user_data: userData } = request.defra.user;
    userData.contactDetails = payloadToContactDetails(payload);

    await setUserData(userId, userData);
    return h.redirect('/');
  }

  return getContactFormView(h, view, form);
};

exports.getContactInformation = getContactInformation;
exports.postContactInformation = postContactInformation;
