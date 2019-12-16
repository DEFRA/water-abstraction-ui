function updateView() {
  var isChecked = $('#meterReset-1').is(':checked');
  $('#meterReset-1-item-hint').toggle(isChecked);
};

$(function() {
  updateView();
  $('[name=meterReset]').on('change', updateView);
});
