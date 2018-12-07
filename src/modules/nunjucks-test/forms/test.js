const { formFactory, fields } = require('../../../lib/forms');

const testForm = (request) => {
  const f = formFactory('/nunjucks-test');

  f.fields.push(fields.text('text', { label: 'A text field' }));

  f.fields.push(fields.text('text_hint', { label: 'A text field with hint', hint: 'Hint here' }));
  f.fields.push(fields.text('text_error', { label: 'A text field with error',
    errors: {
      'any.empty': {
        message: 'Enter a value in the field'
      }
    } }));

  f.fields.push(fields.date('date', { label: 'A date field', hint: 'Hint here' }));

  f.fields.push(fields.date('date_error', { label: 'Date in error state',
    errors: {
      'string.isoDate': {
        message: 'Enter a valid date'
      }
    } }));

  f.fields.push(fields.radio('isSingleTotal', {
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
    ]}));

  f.fields.push(fields.paragraph(null, {
    text: 'You only need to tell us about one meter.'
  }));

  f.fields.push(fields.checkbox('isMultiplier', {
    label: 'This meter has a ×10 display',
    checked: true,
    hint: 'Select if your meter has a 10x display'
  }, 'multiply'));

  f.fields.push(fields.dropdown('dropdown', {
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
    ]}, 'ngr'));

  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

module.exports = testForm;
