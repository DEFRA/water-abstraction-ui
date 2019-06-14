const { formFactory, fields } = require('shared/lib/forms');

const mapChoices = userData => {
  return userData.companies.map((company, index) => ({
    label: company.name,
    value: index
  }));
};

/**
 * @param {Object} request - current HAPI request
 * @param {Object} userData - data from water service users call
 */
const form = (request, userData) => {
  const { csrfToken } = request.view;

  const f = formFactory('/select-company');

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  f.fields.push(fields.radio('company', {
    label: 'Choose a licence holder',
    heading: true,
    choices: mapChoices(userData),
    errors: {
      'any.required': {
        message: 'Select a licence holder'
      }
    }
  }));

  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

exports.selectCompanyForm = form;
