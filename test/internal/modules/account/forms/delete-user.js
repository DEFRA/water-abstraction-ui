const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const {
  deleteUserForm,
  deleteUserSchema
} = require('internal/modules/account/forms/delete-user');

const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  params: {
    userId: 'user-id'
  },
  view: {
    csrfToken: 'token'
  }
});

experiment('account/forms/delete-user form', () => {
  test('sets the form method to POST', async () => {
    const form = deleteUserForm(createRequest());
    expect(form.method).to.equal('POST');
  });

  test('sets the form action to correct address', async () => {
    const request = createRequest();
    const form = deleteUserForm(request);
    expect(form.action).to.equal(`/account/delete-account/${request.params.userId}`);
  });

  test('has CSRF token field', async () => {
    const form = deleteUserForm(createRequest());
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal('token');
  });

  test('has expected choices', async () => {
    const form = deleteUserForm(createRequest());
    const field = findField(form, 'confirmDelete');
    const value = field.options.choices.map(choice => choice.value);
    expect(value).to.once.include(['confirm']);
  });

  test('has a submit button', async () => {
    const form = deleteUserForm(createRequest());
    const button = findButton(form);
    expect(button.options.label).to.equal('Confirm');
  });
});

experiment('account/forms/delete-user schema', () => {
  experiment('csrf token', () => {
    test('validates for a uuid', async () => {
      const result = deleteUserSchema.csrf_token.validate('c5afe238-fb77-4131-be80-384aaf245842');
      expect(result.error).to.be.null();
    });

    test('fails for a string that is not a uuid', async () => {
      const result = deleteUserSchema.csrf_token.validate('pasta');
      expect(result.error).to.exist();
    });
  });

  experiment('confirmDelete', () => {
    test('validates for confirm value', async () => {
      const result = deleteUserSchema.confirmDelete.validate(['confirm']);
      expect(result.error).to.be.null();
    });

    test('fails if value is not in an array', async () => {
      const result = deleteUserSchema.confirmDelete.validate('confirm');
      expect(result.error).to.exist();
    });

    test('fails for any other value', async () => {
      const result = deleteUserSchema.confirmDelete.validate(['pasta']);
      expect(result.error).to.exist();
    });
  });
});
