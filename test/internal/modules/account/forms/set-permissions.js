const { expect } = require('@hapi/code');
const { beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script();
const { setPermissionsForm, setPermissionsSchema } = require('internal/modules/account/forms/set-permissions');

const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  }
});

experiment('account/forms/set-permissions form', () => {
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
        'nps_ar_user',
        'nps_ar_approver',
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

experiment('account/forms/set-permissions schema', () => {
  experiment('csrf token', () => {
    test('validates for a uuid', async () => {
      const result = setPermissionsSchema.csrf_token.validate('c5afe238-fb77-4131-be80-384aaf245842');
      expect(result.error).to.be.null();
    });

    test('fails for a string that is not a uuid', async () => {
      const result = setPermissionsSchema.csrf_token.validate('pasta');
      expect(result.error).to.exist();
    });
  });

  experiment('permissions', () => {
    const validPermissions = [
      'basic',
      'billing_and_data',
      'environment_officer',
      'nps',
      'nps_ar_user',
      'nps_ar_approver',
      'psc',
      'wirs'
    ];

    validPermissions.forEach(permission => {
      test(`${permission} is a valid value`, async () => {
        expect(setPermissionsSchema.permission.validate(permission).error).to.be.null();
      });
    });

    test('does not validate invalid permissions', async () => {
      expect(setPermissionsSchema.permission.validate('not-valid').error).not.to.be.null();
    });

    test('permission is required', async () => {
      expect(setPermissionsSchema.permission.validate('').error).not.to.be.null();
    });
  });
});
