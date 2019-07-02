const Joi = require('joi');
const { formFactory, fields } = require('../../../../shared/lib/forms');

const createNameField = (name) => {
  return fields.text('name', {
    label: 'Name this licence',
    hint: 'You can give this licence a name to help you search for it more easily.',
    attr: {
      minlength: 2,
      maxlength: 32
    },
    errors: {
      'any.empty': {
        message: 'Enter a licence name'
      },
      'string.min': {
        message: 'Choose a name that is 2-32 characters long'
      },
      'string.max': {
        message: 'Choose a name that is 2-32 characters long'
      }
    },
    controlClass: 'govuk-input--width-20'
  }, name);
};

const renameLicenceForm = (request, name) => {
  const { csrfToken } = request.view;
  const { documentId } = request.params;

  const f = formFactory(`/licences/${documentId}/rename`);

  f.fields.push(createNameField(name));
  f.fields.push(fields.button(null, { label: 'Save', controlClass: 'govuk-!-margin-0' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

const renameLicenceSchema = {
  csrf_token: Joi.string().guid().required(),
  name: Joi.string().max(32).min(2)
};

exports.renameLicenceForm = renameLicenceForm;
exports.renameLicenceSchema = renameLicenceSchema;
