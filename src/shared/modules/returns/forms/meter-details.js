const { fields } = require('shared/lib/forms');

const getErrors = message => {
  return {
    'any.required': { message },
    'any.empty': { message }
  };
};

const getTextField = (fieldName, label, errorMessage, autoFocus = false) => {
  return fields.text(fieldName, {
    label,
    controlClass: 'govuk-input--width-10',
    errors: getErrors(errorMessage),
    attr: {
      autofocus: autoFocus || undefined
    }
  });
};

const getMultiplierField = (label, hint, checked) => {
  return fields.checkbox('isMultiplier', {
    choices: [{
      label,
      hint,
      value: 'multiply'
    }]
  }, checked);
};

exports.getTextField = getTextField;
exports.getMultiplierField = getMultiplierField;
