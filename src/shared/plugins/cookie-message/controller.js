'use strict';

const { handleRequest, getValues } = require('shared/lib/forms/');
const { handleFormRequest } = require('shared/lib/form-handler');

const cookiesForm = require('./forms/cookie-form');
const constants = require('./lib/constants');

const redirectPathSessionKey = 'cookiesPageRedirectPath';

const getCookies = async (request, h) => {
  // Store redirect path to redirect back to original page
  if (request.method === 'get') {
    request.yar.set(redirectPathSessionKey, request.query.redirectPath);
  }

  const form = handleFormRequest(request, cookiesForm);

  return h.view('nunjucks/content/cookies', {
    ...request.view,
    form,
    redirectPath: request.yar.get(redirectPathSessionKey),
    isNotificationBannerVisible: form.isValid
  });
};

const postCookies = async (request, h) => {
  const form = handleRequest(cookiesForm.form(request), request);

  if (form.isValid) {
    // Set the cookie preferences
    const { acceptAnalyticsCookies } = getValues(form);
    h.state(constants.cookieName, acceptAnalyticsCookies ? constants.accepted : constants.declined);
  }

  return h.postRedirectGet(form);
};

exports.getCookies = getCookies;
exports.postCookies = postCookies;
