const Joi = require('joi');
const { formFactory, fields, setValues } = require('shared/lib/forms');

const form = (request, data = {}) => {
  const f = formFactory('/notifications', 'GET');

  f.fields.push(fields.text('sentBy', {
    widget: 'search',
    hint: 'Filter by sent by email',
    errors: {
      'string.email': {
        message: 'Enter a valid email'
      }
    }
  }));

  f.fields.push(fields.checkbox('filter', {
    widget: 'search',
    hint: 'Filter by Notification type',
    errors: {
      'string.empty': {
        message: 'Enter a Sent by email or select Notification type'
      }
    }
  }));

  return setValues(f, data);
};

const schema = () => Joi.object().keys({
  page: Joi.number().integer().min(1).default(1),
  filter: Joi.array().optional(),
  sentBy: Joi.string().trim().email().allow('')
});

exports.form = form;
exports.schema = schema;
