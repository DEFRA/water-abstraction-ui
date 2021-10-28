'use strict';

const { formFactory, fields } = require('shared/lib/forms/');
const Joi = require('joi');

const deleteFinancialYearEndingSchema = () => {
  return Joi.object({
    csrf_token: Joi.string().uuid().required(),
    batchId: Joi.string().uuid().required(),
    licenceId: Joi.string().uuid().required(),
    financialYearEnding: Joi.string().required()
  });
};

const deleteFinancialYearEndingForm = (request) => {
  const { csrfToken } = request.view;
  const { batchId, licenceId, financialYearEnding} = request.params;
  const f = formFactory(request.path);
  const buttonLabel = 'Remove charges';

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.hidden('batchId', {}, batchId));
  f.fields.push(fields.hidden('licenceId', {}, licenceId));
  f.fields.push(fields.hidden('financialYearEnding', {}, financialYearEnding));
  f.fields.push(fields.button(null, { label: buttonLabel }));

  return f;
};

exports.form = deleteFinancialYearEndingForm;
exports.schema = deleteFinancialYearEndingSchema;
