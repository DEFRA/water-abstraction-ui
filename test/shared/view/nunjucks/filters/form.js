'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { cloneDeep } = require('lodash');
const { handleRequest } = require('shared/lib/forms');

const {
  mapFormField,
  mapFormErrorSummary,
  mapFormDateField,
  mapFormRadioField,
  setConditionalRadioField,
  mapFormCheckbox,
  mapFormDropdownField,
  isFirstFieldHeading
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
  let result;

  experiment('for a simple example', () => {
    beforeEach(async () => {
      result = mapFormField(textField);
    });

    test('It should set the label property', async () => {
      expect(result.label.text).to.equal(textField.options.label);
    });

    test('The label class is null', async () => {
      expect(result.label.classes).to.equal(null);
    });

    test('The label isPageHeading property is false', async () => {
      expect(result.label.isPageHeading).to.equal(false);
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

  experiment('when the field "heading" property is true', () => {
    beforeEach(async () => {
      result = mapFormField({
        ...textField,
        options: {
          ...textField.options,
          heading: true
        }
      });
    });

    test('It should set the label property', async () => {
      expect(result.label.text).to.equal(textField.options.label);
    });

    test('The label class is govuk-label--l', async () => {
      expect(result.label.classes).to.equal('govuk-label--l');
    });

    test('The label isPageHeading property is true', async () => {
      expect(result.label.isPageHeading).to.equal(true);
    });
  });
});

experiment('mapFormErrorSummary', () => {
  let f, result;
  experiment('when there is only an error message', () => {
    beforeEach(async () => {
      const formWithError = cloneDeep(form);
      formWithError.fields[0].options.errors = {
        'any.required': {
          message: 'Error message'
        }
      };
      f = handleRequest(formWithError, { log: console.log, payload: {} }, schema);
      result = mapFormErrorSummary(f);
    });

    test('It should set the title property', async () => {
      expect(result.titleText).to.equal('There is a problem');
    });

    test('It should set the href property', async () => {
      expect(result.errorList[0].href).to.equal('#text_field');
    });

    test('It should set the error message property', async () => {
      expect(result.errorList[0].text).to.be.a.string();
    });

    test('The error message used is from the "message" property of the field errors object', async () => {
      expect(result.errorList[0].text).to.equal('Error message');
    });

    test('It should set the href to the first radio button in a list', async () => {
      expect(result.errorList[1].href).to.equal('#radio_field');
    });

    test('It should set the href to the first radio button in a list', async () => {
      expect(result.errorList[2].href).to.equal('#checkbox_field');
    });
  });

  experiment('when there is an error message and summary', () => {
    beforeEach(async () => {
      const formWithError = cloneDeep(form);
      formWithError.fields[0].options.errors = {
        'any.required': {
          message: 'Error message',
          summary: 'Error summary'
        }
      };
      f = handleRequest(formWithError, { log: console.log, payload: {} }, schema);
      result = mapFormErrorSummary(f);
    });

    test('The error message used is from the "summary" property of the field errors object', async () => {
      expect(result.errorList[0].text).to.equal('Error summary');
    });
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

  test('It should set the item html property', async () => {
    const htmlCheckbox = checkboxField;
    htmlCheckbox.options.choices[0].label = undefined;
    htmlCheckbox.options.choices[0].htmlLabel = 'label with <strong>html</strong>';
    const resultWithHtml = mapFormCheckbox(htmlCheckbox);
    expect(resultWithHtml.items[0].html).to.equal(htmlCheckbox.options.choices[0].htmlLabel);
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

  experiment('.isFirstFieldHeading', () => {
    test('returns false when the first form field is a label but the heading option is false', async () => {
      expect(isFirstFieldHeading(form)).to.be.false();
    });

    test('returns true when the first form field is a label and the heading option is true', async () => {
      const formWithHeading = cloneDeep(form);
      formWithHeading.fields[0].options.heading = true;
      expect(isFirstFieldHeading(formWithHeading)).to.be.true();
    });

    test('returns false when the second form field is a label and the heading option is true', async () => {
      const formWithHeading = cloneDeep(form);
      formWithHeading.fields[1].options.heading = true;
      expect(isFirstFieldHeading(formWithHeading)).to.be.false();
    });
  });
});
