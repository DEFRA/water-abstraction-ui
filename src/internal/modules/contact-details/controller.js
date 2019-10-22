'use strict';
const { get, pick } = require('lodash');
const { handleRequest } = require('shared/lib/forms');
const { setUserData } = require('../../lib/user-data');
const { contactDetailsForm, contactDetailsSchema } = require('./contact-details-form');

const payloadToContactDetails = payload =>
  pick(payload, ['name', 'jobTitle', 'tel', 'email', 'address']);

const getContactFormView = (h, viewContext, form) => {
  return h.view('nunjucks/form', {
    ...viewContext,
    form
  });
};

const getUserData = request => get(request, 'defra.user.user_data', {});
const getContactDetails = request => get(request, 'defra.user.user_data.contactDetails', {});

const getContactInformation = async (request, h) => {
  const contactDetails = getContactDetails(request);
  const { view } = request;
  return getContactFormView(h, view, contactDetailsForm(request, contactDetails));
};

const postContactInformation = async (request, h) => {
  const { view, payload } = request;
  const form = handleRequest(contactDetailsForm(request, payload), request, contactDetailsSchema);

  if (form.isValid) {
    const { userId } = request.defra;

    const userData = {
      ...getUserData(request),
      contactDetails: payloadToContactDetails(payload)
    };

    await setUserData(userId, userData);
    return h.redirect('/');
  }

  return getContactFormView(h, view, form);
};

exports.getContactInformation = getContactInformation;
exports.postContactInformation = postContactInformation;
