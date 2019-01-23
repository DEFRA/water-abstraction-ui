'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');

const { handleRequest } = require('../../../../src/lib/forms');

const {
  mapFormField,
  mapFormErrorSummary,
  mapFormDateField,
  mapFormRadioField,
  setConditionalRadioField,
  mapFormCheckbox,
  mapFormDropdownField
} = require('../../../../src/lib/view-engine/filters/form.js');

const {
  textField, form, schema, dateField, radioField, checkboxField, dropdownField
} = require('./test-helpers');

lab.experiment('mapFormField', () => {
  const result = mapFormField(textField);

  lab.test('It should set the label property', async () => {
    expect(result.label.text).to.equal(textField.options.label);
  });

  lab.test('It should set the name property', async () => {
    expect(result.name).to.equal(textField.name);
  });

  lab.test('It should set the id property', async () => {
    expect(result.id).to.equal(textField.name);
  });

  lab.test('It should set the hint text property', async () => {
    expect(result.hint.text).to.equal(textField.options.hint);
  });

  lab.test('It should set the value property', async () => {
    expect(result.value).to.equal(textField.value);
  });

  lab.test('It should set the class property', async () => {
    expect(result.classes).to.equal(textField.options.controlClass);
  });
});

lab.experiment('mapFormErrorSummary', () => {
  const f = handleRequest(form, { log: console.log, payload: {} }, schema);
  const result = mapFormErrorSummary(f);

  lab.test('It should set the title property', async () => {
    expect(result.titleText).to.equal('There is a problem');
  });

  lab.test('It should set the href property', async () => {
    expect(result.errorList[0].href).to.equal('#text_field');
  });

  lab.test('It should set the error message property', async () => {
    expect(result.errorList[0].text).to.be.a.string();
  });

  lab.test('It should set the href to the first radio button in a list', async () => {
    expect(result.errorList[1].href).to.equal('#radio_field-1');
  });

  lab.test('It should set the href to the first radio button in a list', async () => {
    expect(result.errorList[2].href).to.equal('#checkbox_field-1');
  });
});

lab.experiment('mapFormDateField', () => {
  const result = mapFormDateField(dateField);

  lab.test('It should set the fieldset legend property', async () => {
    expect(result.fieldset.legend.text).to.equal(dateField.options.label);
  });

  lab.test('It should set the name property', async () => {
    expect(result.namePrefix).to.equal(dateField.name);
  });

  lab.test('It should set the id property', async () => {
    expect(result.id).to.equal(dateField.name);
  });

  lab.test('It should set the hint text property', async () => {
    expect(result.hint.text).to.equal(dateField.options.hint);
  });

  lab.test('It should set the day name property', async () => {
    expect(result.items[0].name).to.equal('day');
  });

  lab.test('It should set the day value', async () => {
    expect(result.items[0].value).to.equal('01');
  });

  lab.test('It should set the month name property', async () => {
    expect(result.items[1].name).to.equal('month');
  });

  lab.test('It should set the month value', async () => {
    expect(result.items[1].value).to.equal('11');
  });

  lab.test('It should set the year name property', async () => {
    expect(result.items[2].name).to.equal('year');
  });

  lab.test('It should set the year value', async () => {
    expect(result.items[2].value).to.equal('2018');
  });
});

lab.experiment('mapFormRadioField', () => {
  const result = mapFormRadioField(radioField);

  lab.test('It should set the fieldset legend property', async () => {
    expect(result.fieldset.legend.text).to.equal(radioField.options.label);
  });

  lab.test('It should set the name property', async () => {
    expect(result.name).to.equal(radioField.name);
  });

  lab.test('It should set the idPrefix property', async () => {
    expect(result.idPrefix).to.equal(radioField.name);
  });

  lab.test('It should set the hint text property', async () => {
    expect(result.hint.text).to.equal(radioField.options.hint);
  });

  lab.test('It should set the item label property', async () => {
    expect(result.items[0].text).to.equal(radioField.options.choices[0].label);
  });
  lab.test('It should set the item hint property', async () => {
    expect(result.items[0].hint.text).to.equal(radioField.options.choices[0].hint);
  });
  lab.test('It should set the item value property', async () => {
    expect(result.items[0].value).to.equal(radioField.options.choices[0].value);
  });
});

lab.experiment('setConditionalRadioField', () => {
  const options = mapFormRadioField(radioField);

  lab.test('It should set the conditional text property for a radio button', async () => {
    const result = setConditionalRadioField(options, 0, 'Test HTML');
    expect(result.items[0].conditional.html).to.equal('Test HTML');
  });

  lab.test('It should append multiple condition text for a radio button', async () => {
    let result = setConditionalRadioField(options, 0, 'A');
    result = setConditionalRadioField(result, 0, 'B');
    expect(result.items[0].conditional.html).to.equal('AB');
  });
});

lab.experiment('mapFormCheckbox', () => {
  const result = mapFormCheckbox(checkboxField);

  lab.test('It should set the name property', async () => {
    expect(result.name).to.equal(checkboxField.name);
  });

  lab.test('It should set the idPrefix property', async () => {
    expect(result.idPrefix).to.equal(checkboxField.name);
  });

  lab.test('It should set hint text property', async () => {
    expect(result.hint.text).to.equal(checkboxField.options.hint);
  });

  lab.test('It should set the fieldset legend property', async () => {
    expect(result.fieldset.legend.text).to.equal(checkboxField.options.label);
  });
  lab.test('It should set the item hint property', async () => {
    expect(result.items[0].hint.text).to.equal(checkboxField.options.choices[0].hint);
  });

  lab.test('It should set the item text property', async () => {
    expect(result.items[0].text).to.equal(checkboxField.options.choices[0].label);
  });

  lab.test('It should set the item value property', async () => {
    expect(result.items[0].value).to.equal(checkboxField.options.choices[0].value);
  });
});

lab.experiment('mapFormDropdownField', () => {
  const result = mapFormDropdownField(dropdownField);

  lab.test('It should set the fieldset legend property', async () => {
    expect(result.label.text).to.equal(dropdownField.options.label);
  });

  lab.test('It should set the name property', async () => {
    expect(result.name).to.equal(dropdownField.name);
  });

  lab.test('It should set the idPrefix property', async () => {
    expect(result.id).to.equal(dropdownField.name);
  });

  lab.test('It should set the hint text property', async () => {
    expect(result.hint.text).to.equal(dropdownField.options.hint);
  });

  lab.test('It should set the item label property', async () => {
    expect(result.items[0].text).to.equal(dropdownField.options.choices[0].label);
  });
  lab.test('It should set the item value property', async () => {
    expect(result.items[0].value).to.equal(dropdownField.options.choices[0].value);
  });
  lab.test('It should set the selected flag on the correct choice', async () => {
    expect(result.items[0].selected).to.equal(false);
    expect(result.items[1].selected).to.equal(true);
  });
});
