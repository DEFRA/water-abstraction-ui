'use strict';

const { getValues } = require('shared/lib/forms/');
const { handleFormRequest } = require('shared/lib/form-handler');
const constants = require('./lib/constants');

const cookiesForm = require('./forms/cookie-form');

const getCookies = async (request, h) => {
  const form = handleFormRequest(request, cookiesForm);

  const { redirectPath } = getValues(form);

  return h.view('nunjucks/content/cookies', {
    ...request.view,
    form,
    redirectPath,
    isNotificationBannerVisible: form.isValid
  });
};

const postCookies = async (request, h) => {
  const form = handleFormRequest(request, cookiesForm);

  if (form.isValid) {
    // Set the cookie preferences
    const { acceptAnalyticsCookies } = getValues(form);
    h.setCookiePreferences(acceptAnalyticsCookies);
  }

  return h.postRedirectGet(form);
};

const getSetCookiePreferences = async (request, h) => {
  const { acceptAnalytics, redirectPath } = request.query;

  // Set preferences
  h.setCookiePreferences(acceptAnalytics);

  // Set flash message in session
  const message = `You’ve ${acceptAnalytics ? 'accepted' : 'rejected'} analytics cookies.`;
  request.yar.flash(constants.flashMessageType, message);

  // Redirect to original page
  return h.redirect(redirectPath);
};

exports.getCookies = getCookies;
exports.postCookies = postCookies;
exports.getSetCookiePreferences = getSetCookiePreferences;
