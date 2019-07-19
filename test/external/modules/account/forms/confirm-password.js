const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const { confirmPasswordForm } = require('external/modules/account/forms/confirm-password');

const { handleRequest } = require('shared/lib/forms');

const createRequest = () => {
  return {
    view: {
      csrfToken: 'test-csrf-token'
    },
    payload: {
      csrf_token: 'test-csrf-token'
    }
  };
};

experiment('confirmPasswordForm', () => {
  test('has an password field', async () => {
    const form = confirmPasswordForm(createRequest());
    const email = form.fields.find(x => x.name === 'password');
    expect(email).to.exist();
  });

  test('has a hidden csrf field', async () => {
    const form = confirmPasswordForm(createRequest());
    const csrf = form.fields.find(x => x.name === 'csrf_token');
    expect(csrf.value).to.equal('test-csrf-token');
  });

  test('has a continue button', async () => {
    const form = confirmPasswordForm(createRequest());
    const button = form.fields.find(f => {
      return f.options.widget === 'button' && f.options.label === 'Continue';
    });
    expect(button).to.exist();
  });

  experiment('errors', () => {
    test('returns an error if the password field is missing', async () => {
      const request = createRequest();
      request.payload.password = '';

      const form = confirmPasswordForm(request);
      const validated = handleRequest(form, request);

      expect(validated.isValid).to.be.false();

      expect(validated.errors.find(f => {
        return f.name === 'password' &&
          f.message === 'Check your password';
      })).to.exist();
    });
  });
});
