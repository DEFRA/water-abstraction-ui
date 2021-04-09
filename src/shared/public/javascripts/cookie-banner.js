$(function () {

  var cookieName = 'accept_analytics_cookies';

  function rejectAnalyticsCookies() {
    // Set the cookie which stores the preference
    Cookies.set(cookieName, 'no', { expires: 28 });

    // Remove the default cookies
    // See https://stackoverflow.com/questions/30578614/delete-google-analytics-cookies-and-eu-e-privacy-law
    // _ga is used to distinguish users.
    Cookies.remove('_ga', { path: '/', domain: document.domain });
    // _gid is used to distinguish users.
    Cookies.remove('_gid', { path: '/', domain: document.domain });
    // _gat is used to throttle request rate.
    Cookies.remove('_gat', { path: '/', domain: document.domain });
    // _gat_govuk_shared is used for cross-site tracking on gov.uk
    Cookies.remove('_gat_govuk_shared', { path: '/', domain: document.domain });

    // Hide currently visible message
    $('[data-cookie-bar=choices]').hide();

    // Show a confirmation message
    $('[data-cookie-bar=rejected]').show();

  };

  function acceptAnalyticsCookies() {
    // Set the cookie which stores the preference
    Cookies.set(cookieName, 'yes', { expires: 28 });

    // Hide currently visible message
    $('[data-cookie-bar=choices]').hide();

    // Show a confirmation message
    $('[data-cookie-bar=accepted]').show();
  };

  function hideCookieBanner() {
    $('.govuk-cookie-banner').hide();
  };

  var actions = {
    reject: rejectAnalyticsCookies,
    accept: acceptAnalyticsCookies,
    hide: hideCookieBanner
  };

  $('#cookie-banner-js-enabled button').on('click', function () {
    // Get button value
    var value = $(this).val();
    return actions[value]();
  });

});
