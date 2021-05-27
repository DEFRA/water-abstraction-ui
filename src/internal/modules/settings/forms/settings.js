'use strict';

const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms');

const getRadioField = (name, label, value) => fields.radio(name, {
  label,
  choices: [{
    label: 'Enabled',
    value: true
  }, {
    label: 'Disabled',
    value: false
  }],
  mapper: 'booleanMapper'
}, value);

/**
 * Creates an object to represent the form for capturing the
 * new user's email address.
 *
 * @param {Object} request The Hapi request object
 * @param {String} email The user's email address
 */
const form = (request, userEmail) => {
  const { csrfToken } = request.view;
  const { data } = request.pre.applicationState;

  const f = formFactory(request.path);

  f.fields.push(
    getRadioField('isInvoiceAccountImportEnabled', 'NALD billing account import', data.isInvoiceAccountImportEnabled),
    getRadioField('isLicenceAgreementImportEnabled', 'NALD licence agreement import', data.isLicenceAgreementImportEnabled),
    getRadioField('isBillingDocumentRoleImportEnabled', 'NALD billing document role import', data.isBillingDocumentRoleImportEnabled)
  );

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Confirm' }));

  return f;
};

const schema = () => Joi.object({
  csrf_token: Joi.string().uuid().required(),
  isInvoiceAccountImportEnabled: Joi.boolean().required(),
  isLicenceAgreementImportEnabled: Joi.boolean().required(),
  isBillingDocumentRoleImportEnabled: Joi.boolean().required()
});

exports.form = form;
exports.schema = schema;
