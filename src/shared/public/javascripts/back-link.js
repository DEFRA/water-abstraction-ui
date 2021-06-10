$('.govuk-back-link:not([data-no-js])').on('click', function (ev) {
  window.history.back();
  ev.preventDefault();
  return false;
});
