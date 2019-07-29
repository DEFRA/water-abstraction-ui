const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms');

const sendRemindersForm = (request) => {
  const { csrfToken } = request.view;

  const action = request.view.path;

  const f = formFactory(action);
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.text('excludeLicences', {
    label: 'Enter the licence numbers which you want to exclude from this mailing list',
    multiline: true,
    hint: 'Separate the licence numbers with a comma or new line.',
    mapper: 'licenceNumbersMapper'
  }));

  f.fields.push(fields.paragraph(null, { text: 'This will assemble the mailing list. It will not send the letters yet.' }));

  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = {
  excludeLicences: Joi.string().allow(''),
  csrf_token: Joi.string().guid().required()
};

exports.sendRemindersForm = sendRemindersForm;
exports.sendRemindersSchema = schema;
