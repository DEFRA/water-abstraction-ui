$(function() {

  $('tr[data-clickable]').addClass('table__row--clickable');
  $('.govuk-inset-text[data-clickable]').addClass('inset-text--clickable');

  $('[data-clickable]').on('click', function() {
    window.location.href = $(this).find('a:first').attr('href');
    ev.preventDefault();
  });
});
