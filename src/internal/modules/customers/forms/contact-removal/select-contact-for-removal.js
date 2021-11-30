const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');
const session = require('../../session');

const getWarningText = ({ naldContactsExist, billingContactsExist }) => {
  if (billingContactsExist || naldContactsExist) {
    return 'Only additional contacts can be removed from this customer';
  }
  return '';
};

const selectContactForRemovalForm = request => {
  const form = formFactory(request.path);

  const { companyContactsForRemoval, naldContactsExist, billingContactsExist } = session.get(request);
  const warningText = getWarningText({ naldContactsExist, billingContactsExist });

  if (warningText) {
    form.fields.push(fields.warningText(null, {
      text: warningText
    }));
  }

  form.fields.push(fields.radio('companyContactId', {
    errors: {
      'any.required': {
        message: 'Select a contact to remove'
      }
    },
    choices: companyContactsForRemoval.map(({ name, companyContactId }) => ({ label: name, value: companyContactId }))
  }));

  form.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));

  if (companyContactsForRemoval.length) {
    form.fields.push(fields.button(null, { label: 'Continue' }));
  }
  return form;
};

const selectContactForRemovalSchema = () => {
  return Joi.object().keys({
    companyContactId: Joi.string().uuid().required(),
    csrf_token: Joi.string().uuid().required()
  });
};

exports.form = selectContactForRemovalForm;
exports.schema = selectContactForRemovalSchema;
