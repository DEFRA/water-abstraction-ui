const { formFactory, fields } = require('../../../lib/forms');

const textField = fields.text('text', { label: 'A text field' });
const textFieldWithHint = fields.text('text_hint', { label: 'A text field with hint', hint: 'Hint here' });
const textFieldWithError = fields.text('text_error', { label: 'A text field with error',
  errors: {
    'any.empty': {
      message: 'Enter a value in the field'
    }
  }});
const dateField = fields.date('date', { label: 'A date field', hint: 'Hint here' });
const dateFieldWithError = fields.date('date_error', { label: 'Date in error state',
  errors: {
    'string.isoDate': {
      message: 'Enter a valid date'
    }
  }});
const radioField = fields.radio('isSingleTotal', {
  label: 'Is it a single amount of abstracted water?',
  mapper: 'booleanMapper',
  errors: {
    'any.required': {
      summary: 'Select if you are reporting a single amount or not',
      message: 'Select if you are reporting a single amount'
    }
  },
  choices: [
    { value: true,
      label: 'Yes',
      hint: 'Select if you abstracted water',
      fields: [
        fields.text('total', {
          label: 'Enter the total amount',
          type: 'number',
          controlClass: 'form-control form-control--small',
          errors: {
            'number.base': {
              message: 'Enter a total figure'
            },
            'number.min': {
              message: 'Total figure must be greater than 0'
            }
          }
        })
      ]},
    { value: false, label: 'No' }
  ]});
const paragraphField = fields.paragraph(null, {
  text: 'You only need to tell us about one meter.'
});

const checkboxField = fields.checkbox('uses', {
  label: 'What did you use water for this year?',
  hint: 'Hint text',
  choices: [
    {
      value: 'spray',
      label: 'Spray irrigation',
      hint: 'Irrigating crops with a spray'
    },
    {
      value: 'trickle',
      label: 'Trickle irrigation'
    }
  ]
});

const dropdownField = fields.dropdown('dropdown', {
  label: 'Abstraction point type',
  hint: 'How is the abstraction point defined',
  choices: [
    {
      value: 'ngr',
      label: 'National grid reference'
    },
    {
      value: 'point',
      label: 'Point on a map'
    }
  ]}, 'ngr');

const button = fields.button(null, { label: 'Continue' });

const testForm = (request) => {
  const { csrfToken } = request.view;
  const f = formFactory('/nunjucks-test');

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(textField);
  f.fields.push(textFieldWithHint);
  f.fields.push(textFieldWithError);
  f.fields.push(dateField);
  f.fields.push(dateFieldWithError);
  f.fields.push(radioField);
  f.fields.push(paragraphField);
  f.fields.push(checkboxField);
  f.fields.push(dropdownField);
  f.fields.push(button);

  return f;
};

module.exports = testForm;
