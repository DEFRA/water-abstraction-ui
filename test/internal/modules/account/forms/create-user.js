const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const {
  createUserSchema,
  createUserForm
} = require('internal/modules/account/forms/create-user');

const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  }
});

experiment('account/forms/create-user form', () => {
  test('sets the form method to POST', async () => {
    const form = createUserForm(createRequest());
    expect(form.method).to.equal('POST');
  });

  test('has CSRF token field', async () => {
    const form = createUserForm(createRequest());
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal('token');
  });

  test('has an input for the email', async () => {
    const form = createUserForm(createRequest());
    const email = findField(form, 'email');
    expect(email).to.exist();
  });

  test('sets the value if supplied', async () => {
    const request = createRequest();
    const email = 'test@example.com';

    const form = createUserForm(request, email);
    const field = findField(form, 'email');

    expect(field.value).to.equal(email);
  });

  test('has a submit button', async () => {
    const form = createUserForm(createRequest());
    const button = findButton(form);
    expect(button.options.label).to.equal('Continue');
  });
});

experiment('account/forms/create-user schema', () => {
  experiment('csrf token', () => {
    test('validates for a uuid', async () => {
      const result = createUserSchema.validate({ csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842' }, { allowUnknown: true });
      expect(result.error).to.be.undefined();
    });

    test('fails for a string that is not a uuid', async () => {
      const result = createUserSchema.validate({ csrf_token: 'pasta' }, { allowUnknown: true });
      expect(result.error).to.exist();
    });
  });

  experiment('email', () => {
    test('validates for a defra email', async () => {
      const result = createUserSchema.validate({ csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842', email: 'test@defra.gov.uk' }, { allowUnknown: true });
      expect(result.error).to.be.undefined();
    });

    test('validates for an environment agency email', async () => {
      const result = createUserSchema.validate({ csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842', email: 'test@environment-agency.gov.uk' }, { allowUnknown: true });
      expect(result.error).to.be.undefined();
    });

    test('fails for an invalid email', async () => {
      const result = createUserSchema.validate({ csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842', email: 'pasta' }, { allowUnknown: true });
      expect(result.error).to.exist();
    });

    test('fails for a non gov tld', async () => {
      const result = createUserSchema.validate({ csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842', email: 'test@example.com' }, { allowUnknown: true });
      expect(result.error).to.exist();
    });

    test('lower cases the input email', async () => {
      const input = { csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842', email: 'SHOUTY@DEFRA.GOV.UK' };
      const expectedOutput = {
        value: {
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          email: 'shouty@defra.gov.uk'
        }
      };
      const result = createUserSchema.validate(input, { allowUnknown: true });
      expect(result).to.equal(expectedOutput);
    });

    test('trims the input email', async () => {
      const result = createUserSchema.validate({ csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842', email: '  test@defra.gov.uk  ' }, { allowUnknown: true });
      expect(result.value.email).to.equal('test@defra.gov.uk');
    });
  });
});
