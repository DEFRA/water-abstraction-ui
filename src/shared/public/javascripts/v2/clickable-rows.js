$(function() {

  $('tr[data-clickable]').addClass('table__row--clickable');

  $('[data-clickable]').on('click', function() {
    window.location.href = $(this).find('a:first').attr('href');
    ev.preventDefault();
  });
});
