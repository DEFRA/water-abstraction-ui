'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { handleRequest } = require('shared/lib/forms');

const {
  mapFormField,
  mapFormErrorSummary,
  mapFormDateField,
  mapFormRadioField,
  setConditionalRadioField,
  mapFormCheckbox,
  mapFormDropdownField
} = require('shared/view/nunjucks/filters/form');

const {
  textField,
  form,
  schema,
  dateField,
  radioField,
  checkboxField,
  dropdownField
} = require('./test-helpers');

experiment('mapFormField', () => {
  const result = mapFormField(textField);

  test('It should set the label property', async () => {
    expect(result.label.text).to.equal(textField.options.label);
  });

  test('It should set the name property', async () => {
    expect(result.name).to.equal(textField.name);
  });

  test('It should set the id property', async () => {
    expect(result.id).to.equal(textField.name);
  });

  test('It should set the hint text property', async () => {
    expect(result.hint.text).to.equal(textField.options.hint);
  });

  test('It should set the value property', async () => {
    expect(result.value).to.equal(textField.value);
  });

  test('It should set the class property', async () => {
    expect(result.classes).to.equal(textField.options.controlClass);
  });
});

experiment('mapFormErrorSummary', () => {
  const f = handleRequest(form, { log: console.log, payload: {} }, schema);
  const result = mapFormErrorSummary(f);

  test('It should set the title property', async () => {
    expect(result.titleText).to.equal('There is a problem');
  });

  test('It should set the href property', async () => {
    expect(result.errorList[0].href).to.equal('#text_field');
  });

  test('It should set the error message property', async () => {
    expect(result.errorList[0].text).to.be.a.string();
  });

  test('It should set the href to the first radio button in a list', async () => {
    expect(result.errorList[1].href).to.equal('#radio_field-1');
  });

  test('It should set the href to the first radio button in a list', async () => {
    expect(result.errorList[2].href).to.equal('#checkbox_field-1');
  });
});

experiment('mapFormDateField', () => {
  const result = mapFormDateField(dateField);

  test('It should set the fieldset legend property', async () => {
    expect(result.fieldset.legend.text).to.equal(dateField.options.label);
  });

  test('It should set the name property', async () => {
    expect(result.namePrefix).to.equal(dateField.name);
  });

  test('It should set the id property', async () => {
    expect(result.id).to.equal(dateField.name);
  });

  test('It should set the hint text property', async () => {
    expect(result.hint.text).to.equal(dateField.options.hint);
  });

  test('It should set the day name property', async () => {
    expect(result.items[0].name).to.equal('day');
  });

  test('It should set the day value', async () => {
    expect(result.items[0].value).to.equal('01');
  });

  test('It should set the month name property', async () => {
    expect(result.items[1].name).to.equal('month');
  });

  test('It should set the month value', async () => {
    expect(result.items[1].value).to.equal('11');
  });

  test('It should set the year name property', async () => {
    expect(result.items[2].name).to.equal('year');
  });

  test('It should set the year value', async () => {
    expect(result.items[2].value).to.equal('2018');
  });
});

experiment('mapFormRadioField', () => {
  const result = mapFormRadioField(radioField);

  test('It should set the fieldset legend property', async () => {
    expect(result.fieldset.legend.text).to.equal(radioField.options.label);
  });

  test('It should set the name property', async () => {
    expect(result.name).to.equal(radioField.name);
  });

  test('It should set the idPrefix property', async () => {
    expect(result.idPrefix).to.equal(radioField.name);
  });

  test('It should set the hint text property', async () => {
    expect(result.hint.text).to.equal(radioField.options.hint);
  });

  test('It should set the item label property', async () => {
    expect(result.items[0].text).to.equal(radioField.options.choices[0].label);
  });
  test('It should set the item hint property', async () => {
    expect(result.items[0].hint.text).to.equal(radioField.options.choices[0].hint);
  });
  test('It should set the item value property', async () => {
    expect(result.items[0].value).to.equal(radioField.options.choices[0].value);
  });
});

experiment('setConditionalRadioField', () => {
  const options = mapFormRadioField(radioField);

  test('It should set the conditional text property for a radio button', async () => {
    const result = setConditionalRadioField(options, 0, 'Test HTML');
    expect(result.items[0].conditional.html).to.equal('Test HTML');
  });

  test('It should append multiple condition text for a radio button', async () => {
    let result = setConditionalRadioField(options, 0, 'A');
    result = setConditionalRadioField(result, 0, 'B');
    expect(result.items[0].conditional.html).to.equal('AB');
  });
});

experiment('mapFormCheckbox', () => {
  const result = mapFormCheckbox(checkboxField);

  test('It should set the name property', async () => {
    expect(result.name).to.equal(checkboxField.name);
  });

  test('It should set the idPrefix property', async () => {
    expect(result.idPrefix).to.equal(checkboxField.name);
  });

  test('It should set hint text property', async () => {
    expect(result.hint.text).to.equal(checkboxField.options.hint);
  });

  test('It should set the fieldset legend property', async () => {
    expect(result.fieldset.legend.text).to.equal(checkboxField.options.label);
  });
  test('It should set the item hint property', async () => {
    expect(result.items[0].hint.text).to.equal(checkboxField.options.choices[0].hint);
  });

  test('It should set the item text property', async () => {
    expect(result.items[0].text).to.equal(checkboxField.options.choices[0].label);
  });

  test('It should set the item value property', async () => {
    expect(result.items[0].value).to.equal(checkboxField.options.choices[0].value);
  });
});

experiment('mapFormDropdownField', () => {
  const result = mapFormDropdownField(dropdownField);

  test('It should set the fieldset legend property', async () => {
    expect(result.label.text).to.equal(dropdownField.options.label);
  });

  test('It should set the name property', async () => {
    expect(result.name).to.equal(dropdownField.name);
  });

  test('It should set the idPrefix property', async () => {
    expect(result.id).to.equal(dropdownField.name);
  });

  test('It should set the hint text property', async () => {
    expect(result.hint.text).to.equal(dropdownField.options.hint);
  });

  test('It should set the item label property', async () => {
    expect(result.items[0].text).to.equal(dropdownField.options.choices[0].label);
  });
  test('It should set the item value property', async () => {
    expect(result.items[0].value).to.equal(dropdownField.options.choices[0].value);
  });
  test('It should set the selected flag on the correct choice', async () => {
    expect(result.items[0].selected).to.equal(false);
    expect(result.items[1].selected).to.equal(true);
  });
});
