/**
 * Script to allow search as you type on license results page
 * @author James Carmichael <jamescarmichael@defra.gsi.gov.uk>
 */
$(function() {

  var state = {
    licenseNumber : '',
    emailAddress : '',
    loading : false,
    sort : 'licenseNumber',
    direction : 1
  };

  /**
   * Clear results page
   */
  function clearResults() {
    $('.license-result').remove();
  }

  /**
   * Load new result set via AJAX GET request
   */
  function loadResults() {

    if(state.licenseNumber == '' && state.emailAddress == '') {
      return;
    }

    state.loading = true;
    clearResults();

    // For prototype, just load one of three pages at random
    var page = Math.ceil(Math.random() * 3);
    var url = 'licence_holder_search_results_' + page;

    $.get(url, function(html) {
      $('#results').append(html);

      // If an email address hasn't been entered, we can't determine the
      // user-defined name
      if(state.emailAddress == '') {
        $('#results p.license-result__column--description').text('-');
      }
    });

  }

  // Debounced version prevents excessive HTTP requests
  loadResultsDebounced = _.debounce(loadResults, 1000);

  function keyPressHandler() {

    // Update state
    var licenseNumber = $('input[name=licenseNumber]').val();
    var emailAddress = $('input[name=emailAddress]').val();

    if(licenseNumber != state.licenseNumber) {
      state.licenseNumber = licenseNumber;
    }
    else if(emailAddress != state.emailAddress) {
      state.emailAddress = emailAddress;
    }
    else {
      return;
    }

    // clearResults();
    loadResultsDebounced();
  }

  $('input[name=licenseNumber]').on('keyup', keyPressHandler);
  $('input[name=emailAddress]').on('keyup', keyPressHandler);

});
