const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const {
  enterNewEmailForm,
  enterNewEmailSchema
} = require('external/modules/account/forms/enter-new-email');

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

experiment('enterNewEmailForm', () => {
  test('has an email field', async () => {
    const form = enterNewEmailForm(createRequest());
    const email = form.fields.find(x => x.name === 'email');
    expect(email).to.exist();
  });

  test('has an email confirmation field', async () => {
    const form = enterNewEmailForm(createRequest());
    const email = form.fields.find(x => x.name === 'confirm-email');
    expect(email).to.exist();
  });

  test('has a hidden csrf field', async () => {
    const form = enterNewEmailForm(createRequest());
    const csrf = form.fields.find(x => x.name === 'csrf_token');
    expect(csrf.value).to.equal('test-csrf-token');
  });

  test('has a continue button', async () => {
    const form = enterNewEmailForm(createRequest());
    const button = form.fields.find(f => {
      return f.options.widget === 'button' && f.options.label === 'Continue';
    });
    expect(button).to.exist();
  });

  experiment('errors', () => {
    test('returns an error if the email field is missing', async () => {
      const request = createRequest();
      request.payload.email = '';
      request.payload['confirm-email'] = 'user@example.com';

      const form = enterNewEmailForm(request);
      const validated = handleRequest(form, request, enterNewEmailSchema);

      expect(validated.isValid).to.be.false();

      expect(validated.errors.find(f => {
        return f.name === 'email' &&
          f.message === 'Enter your new email address';
      })).to.exist();
    });

    test('returns an error if the confirm email field is missing', async () => {
      const request = createRequest();
      request.payload.email = 'user@example.com';
      request.payload['confirm-email'] = '';

      const form = enterNewEmailForm(request);
      const validated = handleRequest(form, request, enterNewEmailSchema);

      expect(validated.isValid).to.be.false();

      expect(validated.errors.find(f => {
        return f.name === 'confirm-email' &&
          f.message === 'Confirm your new email address';
      })).to.exist();
    });

    test('returns an error if the email values do not match', async () => {
      const request = createRequest();
      request.payload.email = 'aaaaa@example.com';
      request.payload['confirm-email'] = 'bbbbb@example.com';

      const form = enterNewEmailForm(request);
      const validated = handleRequest(form, request, enterNewEmailSchema);

      expect(validated.isValid).to.be.false();
      expect(validated.errors.find(f => {
        return f.name === 'confirm-email' &&
          f.message === 'The email addresses must match';
      })).to.exist();
    });

    test('returns an error if the email is not an email', async () => {
      const request = createRequest();
      request.payload.email = 'not-an-email';
      request.payload['confirm-email'] = 'user@example.com';

      const form = enterNewEmailForm(request);
      const validated = handleRequest(form, request, enterNewEmailSchema);

      expect(validated.isValid).to.be.false();
      expect(validated.errors.find(f => {
        return f.name === 'email' &&
          f.message === 'Enter an email address, like name@example.com';
      })).to.exist();
    });

    test('returns an error if the confirmation email is not an email', async () => {
      const request = createRequest();
      request.payload.email = 'user@example.com';
      request.payload['confirm-email'] = 'not-an-email';

      const form = enterNewEmailForm(request);
      const validated = handleRequest(form, request, enterNewEmailSchema);

      expect(validated.isValid).to.be.false();
      expect(validated.errors.find(f => {
        return f.name === 'confirm-email' &&
          f.message === 'The email addresses must match';
      })).to.exist();
    });
  });
});
