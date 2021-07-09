
const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');

const checkFormAllDone = request => {
  const f = formFactory(request.path);

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Confirm' }));
  return f;
};

const checkSchemaAllDone = () => Joi.object({
  csrf_token: Joi.string().uuid().required()
});

exports.form = checkFormAllDone;
exports.schema = checkSchemaAllDone;
