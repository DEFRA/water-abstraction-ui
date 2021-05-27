$('.govuk-back-link:not([data-no-js])').on('click', function (ev) {
  if (!ev.target.href) {
    window.history.back();
    ev.preventDefault();
    return false;
  }
});
