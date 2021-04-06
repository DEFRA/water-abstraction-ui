$(function () {
  $('.govuk-cookie-banner button').on('click', function () {
    // Expires in 28 days
    var maxAge = 28 * 24 * 60 * 60;
    // Set the cookie
    document.cookie = 'seen_cookie_message=yes;max-age=' + maxAge;
    // Hide the banner
    $('.govuk-cookie-banner').hide();
  });
});
