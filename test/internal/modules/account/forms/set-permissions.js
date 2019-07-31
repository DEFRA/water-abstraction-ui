const { expect } = require('@hapi/code');
const { beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script();
const { setPermissionsForm } = require('internal/modules/account/forms/set-permissions');

const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  }
});

experiment('account/forms/set-permissions', () => {
  test('sets the form method to POST', async () => {
    const form = setPermissionsForm(createRequest());
    expect(form.method).to.equal('POST');
  });

  test('has CSRF token field', async () => {
    const form = setPermissionsForm(createRequest());
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal('token');
  });

  experiment('permission field', () => {
    let field;

    beforeEach(async () => {
      const form = setPermissionsForm(createRequest());
      field = findField(form, 'permission');
    });

    test('exists', async () => {
      expect(field).to.exist();
    });

    test('has expected choices', async () => {
      const values = field.options.choices.map(choice => choice.value);
      expect(values).to.once.include([
        'basic',
        'billing_and_data',
        'environment_officer',
        'nps',
        'nps_arr_user',
        'nps_arr_approver',
        'psc',
        'wirs'
      ]);
    });
  });

  test('sets the value if supplied', async () => {
    const request = createRequest();
    const form = setPermissionsForm(request, 'basic');
    const field = findField(form, 'permission');

    expect(field.value).to.equal('basic');
  });

  test('has a submit button', async () => {
    const form = setPermissionsForm(createRequest());
    const button = findButton(form);
    expect(button.options.label).to.equal('Continue');
  });
});
