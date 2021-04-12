'use strict';

const { getValues } = require('shared/lib/forms/');
const { handleFormRequest } = require('shared/lib/form-handler');
const constants = require('./lib/constants');

const cookiesForm = require('./forms/cookie-form');

/**
 * The cookie page where users can review the cookies and set preferences
 * via a form
 *
 * @param {Object} request
 * @param {Object} h
 * @returns {Promise}
 */
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

/**
 * Post handler for the cookies page
 *
 * @param {Object} request
 * @param {Object} h
 * @returns {Promise}
 */
const postCookies = async (request, h) => {
  const form = handleFormRequest(request, cookiesForm);

  if (form.isValid) {
    // Set the cookie preferences
    const { acceptAnalyticsCookies } = getValues(form);
    h.setCookiePreferences(acceptAnalyticsCookies);
  }

  return h.postRedirectGet(form);
};

/**
 * A page which is used to set analytics preferences only when
 * the user sets preferences via the banner.
 *
 * A flash message is set in the session, and the user is then
 * redirected back to the page they were on.
 *
 * @param {Object} request
 * @param {Object} h
 * @returns {Promise}
 */
const getSetCookiePreferences = async (request, h) => {
  const { acceptAnalytics, redirectPath } = request.query;

  // Set preferences
  h.setCookiePreferences(acceptAnalytics);

  // Set flash message in session
  const message = `You’ve ${acceptAnalytics ? 'accepted' : 'rejected'} analytics cookies.`;
  request.yar.flash(constants.flashMessageType, message);

  // Redirect to user's original location page
  return h.redirect(redirectPath);
};

exports.getCookies = getCookies;
exports.postCookies = postCookies;
exports.getSetCookiePreferences = getSetCookiePreferences;
