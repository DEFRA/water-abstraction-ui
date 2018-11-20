const { formFactory, fields } = require('../../../lib/forms');

const getChoices = (returns) => {
  return returns.map(row => ({
    value: row.return_id,
    label: row.licence_ref
  }));
};

const form = (returns) => {
  const [{ return_requirement: formatId }] = returns;
  const action = `/admin/returns/select-licence`;

  const f = formFactory(action, 'GET');

  f.fields.push(fields.hidden('formatId', {}, formatId));
  f.fields.push(fields.hidden('isSubmitted', {}, 1));

  f.fields.push(fields.radio('returnId', {
    errors: {
      'any.required': {
        // summary: 'Select if you are reporting a single amount or not',
        message: 'Select a licence number'
      }
    },
    choices: getChoices(returns)
  }));

  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

module.exports = {
  selectLicenceForm: form
};
