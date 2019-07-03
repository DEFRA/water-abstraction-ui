const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const { verifyNewEmailForm } = require('external/modules/account/forms/verify-new-email');

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

experiment('verifyNewEmailForm', () => {
  test('has a verification code field', async () => {
    const form = verifyNewEmailForm(createRequest());
    const verify = form.fields.find(x => x.name === 'verification-code');
    expect(verify).to.exist();
  });

  test('has a hidden csrf field', async () => {
    const form = verifyNewEmailForm(createRequest());
    const csrf = form.fields.find(x => x.name === 'csrf_token');
    expect(csrf.value).to.equal('test-csrf-token');
  });

  test('has a continue button', async () => {
    const form = verifyNewEmailForm(createRequest());
    const button = form.fields.find(f => {
      return f.options.widget === 'button' && f.options.label === 'Continue';
    });
    expect(button).to.exist();
  });

  experiment('errors', () => {
    test('returns an error if the verification code field is missing', async () => {
      const request = createRequest();
      request.payload['verification-code'] = '';

      const form = verifyNewEmailForm(request);
      const validated = handleRequest(form, request);

      expect(validated.isValid).to.be.false();

      expect(validated.errors.find(f => {
        return f.name === 'verification-code' &&
          f.message === 'Enter the verification code';
      })).to.exist();
    });
  });
});
