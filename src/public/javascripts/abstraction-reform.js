'use strict';

window.WRLS = window.WRLS || {};

window.WRLS.initAutoComplete = function () {
  var selects = document.querySelectorAll('select');
  var currentSelect;

  for (var index = 0; index < selects.length; index += 1) {
    currentSelect = selects[index];

    if (currentSelect.getElementsByTagName('option').length > 200) {
      window.accessibleAutocomplete.enhanceSelectElement({
        selectElement: currentSelect,
        showAllValues: true,
        showNoOptionsFound: true,
        defaultValue: '',
        autoselect: false,
        confirmOnBlur: false
      });
    }
  }
};
