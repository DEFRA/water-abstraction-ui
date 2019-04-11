const Joi = require('joi');
const { formFactory, fields } = require('../../../lib/forms');

const sendRemindersForm = (request) => {
  const { csrfToken } = request.view;

  const action = `/admin/returns-notifications/reminders`;

  const f = formFactory(action);
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.text('excludeLicences', {
    label: 'Exclude licences',
    multiline: true,
    hint: 'Separate licence numbers with a comma or new line'
  }));
  f.fields.push(fields.button(null, { label: 'Send reminders' }));

  return f;
};

const schema = {
  excludeLicences: Joi.string().allow(''),
  csrf_token: Joi.string().guid().required()
};

exports.sendRemindersForm = sendRemindersForm;
exports.sendRemindersSchema = schema;
