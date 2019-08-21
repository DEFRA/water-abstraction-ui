const { omit } = require('lodash');
const { handleRequest, getValues } = require('shared/lib/forms');
const contactDetailsStorage = require('./lib/contact-details-storage');
const nameAndJobForm = require('./forms/name-and-job');
const detailsForm = require('./forms/details-form');

const REDIRECT_SESSION_KEY = 'redirect';

/**
 * Display form for admin user to enter their name and job role
 * prior to entering notification flow
 */
const getNameAndJob = async (request, h, form) => {
  // Where to redirect after flow completes
  const { redirect } = request.query;
  request.yar.set(REDIRECT_SESSION_KEY, redirect);

  const contactDetails = contactDetailsStorage.get(request);

  const view = {
    back: '/manage',
    ...request.view,
    form: form || nameAndJobForm.form(request, contactDetails)
  };

  return h.view('nunjucks/form.njk', view, { layout: false });
};

/**
 * Post handler for name/role form
 * If valid, saves data to session and redirects to next screen
 * otherwise redisplays form with error message
 */
const postNameAndJob = async (request, h) => {
  const form = handleRequest(nameAndJobForm.form(request), request, nameAndJobForm.schema);

  if (form.isValid) {
    const data = omit(getValues(form), 'csrf_token');
    contactDetailsStorage.set(request, data);

    return h.redirect('/notifications/contact-details');
  }

  return getNameAndJob(request, h, form);
};

/**
 * Form to get contact details - email/tel/address
 */
const getDetails = async (request, h, form) => {
  const contactDetails = contactDetailsStorage.get(request);

  const view = {
    back: '/notifications/contact',
    ...request.view,
    form: form || detailsForm.form(request, contactDetails)
  };

  return h.view('nunjucks/form.njk', view, { layout: false });
};

/**
 * Post handler for contact details - email/tel/address
 */
const postDetails = async (request, h) => {
  const form = handleRequest(detailsForm.form(request), request, detailsForm.schema);

  if (form.isValid) {
    const data = omit(getValues(form), 'csrf_token');
    contactDetailsStorage.submit(request, data);

    const path = request.yar.get(REDIRECT_SESSION_KEY);

    return h.redirect(path);
  }

  return getDetails(request, h, form);
};

module.exports = {
  getNameAndJob,
  postNameAndJob,
  getDetails,
  postDetails
};
