$(function() {

  var state = {
    showForm : false
  };

  function updateView() {
    // Show form
    if(state.showForm) {
      $('#licenceName').hide();
      $('#nameForm').show();
      $('#nameForm input[name=name]').trigger('select');
    }
    // Hide form
    else {
      $('#licenceName').show();
      $('#nameForm').hide();
    }
  }


  $('#cancel').on('click', function(ev) {
    state.showForm = false;
    updateView();
    ev.preventDefault();
    ev.stopPropagation();
    return false;
  });

  $('#showForm, #nameLicence').on('click', function(ev) {
    state.showForm = true;
    updateView();
    ev.preventDefault();
    ev.stopPropagation();
    return false;
  });
});
