const Joi = require('joi');
const VALID_DAY = Joi.number().integer().min(1).max(31).required();
const VALID_MONTH = Joi.number().integer().min(1).max(12).required();

const { formFactory, fields } = require('shared/lib/forms/');

const abstractionPeriodForm = request => {
  const f = formFactory(request.path);

  f.fields.push(fields.text('periodStartDay'));
  f.fields.push(fields.text('periodStartMonth'));
  f.fields.push(fields.text('periodEndDay'));
  f.fields.push(fields.text('periodEndMonth'));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return f;
};

const abstractionPeriodSchema = () => Joi.object({
  csrf_token: Joi.string().uuid().required(),
  periodStartDay: VALID_DAY,
  periodStartMonth: VALID_MONTH,
  periodEndDay: VALID_DAY,
  periodEndMonth: VALID_MONTH
});

exports.form = abstractionPeriodForm;
exports.schema = abstractionPeriodSchema;
