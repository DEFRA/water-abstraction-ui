/**
 * Enables the progressive disclosure of form elements for JSON schema forms
 * in abstraction reform.
 * Fields are given an attribute, e.g. data-toggle="{"measurement_point_type":"NGR"}"
 * This means that if the measurement_point_type field is equal to 'NGR', the
 * field will be shown
 */

/* global $ */

/**
 * Gets dropdown or radio field value
 * @param  {String} name - select/radio button attribute
 * @return {String}      value
 */
function getFieldValue (name) {
  const $field = $('[name=' + name + ']');
  if ($field.prop('tagName') === 'SELECT') {
    return $field.val();
  }
  if ($field.prop('tagName') === 'INPUT' && $field.attr('type') === 'radio') {
    return $('[name=' + name + ']:checked').val();
  }
}

/**
 * Tests whether the field should be visible
 * @param {Object} ele - the HTML element
 */
function test (ele) {
  // Get toggle data
  var toggle = JSON.parse($(ele).attr('data-toggle'));
  var result = false;
  for (var key in toggle) {
    var val = getFieldValue(key);
    result = result || (val === toggle[key]);
  }
  return result;
}

/**
 * Refreshes state of form to show/hide conditional elements
 */
const refreshForm = function () {
  $('[data-toggle]').each(function (i, ele) {
    var isVisible = test(ele);
    $(ele).parent('.govuk-form-group').toggle(isVisible);
  });
};

$(function () {
  refreshForm();
  $('input, select').on('change', refreshForm);
});
