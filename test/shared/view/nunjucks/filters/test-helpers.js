const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms');

const textField = fields.text('text_field', {
  label: 'A text field',
  hint: 'A hint',
  controlClass: 'css-class'
}, 'value');

const radioField = fields.radio('radio_field', {
  label: 'A radio field',
  hint: 'A hint',
  controlClass: 'css-class',
  choices: [{
    value: 'option-a',
    hint: 'A hint about option A',
    label: 'A'
  }]
}, 'value');

const checkboxField = fields.checkbox('checkbox_field', {
  label: 'A checkbox field',
  hint: 'A hint',
  controlClass: 'css-class',
  choices: [{
    value: 'option-a',
    hint: 'A hint about option A',
    label: 'A'
  }]
}, ['a']);

const dateField = fields.checkbox('date_field', {
  label: 'Date field',
  hint: 'A hint'
}, '2018-11-01');

const dropdownField = fields.dropdown('dropdown_field', {
  label: 'A dropdown field',
  hint: 'A hint',
  controlClass: 'css-class',
  choices: [{
    value: 'option-a',
    label: 'A'
  }, {
    value: 'option-b',
    label: 'B'
  }]
}, 'option-b');

let f = formFactory('/action');
f.fields.push(textField);
f.fields.push(radioField);
f.fields.push(checkboxField);

const schema = {
  text_field: Joi.string().required(),
  radio_field: Joi.string().required(),
  checkbox_field: Joi.string().required()
};
module.exports = {
  textField,
  radioField,
  checkboxField,
  form: f,
  schema,
  dateField,
  dropdownField
};
