'use strict';

const Joi = require('@hapi/joi');
const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const { createContactForm, createContactFormSchema } = require('internal/modules/invoice-accounts/forms/create-contact');
const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: uuid()
  },
  params: {
    regionId: uuid(),
    companyId: uuid()
  }
});

experiment('invoice-accounts/forms/create-contact form', () => {
  let request;

  beforeEach(async => {
    request = createRequest();
  });
  test('sets the form method to POST', async () => {
    const form = createContactForm(request, {});
    expect(form.method).to.equal('POST');
  });

  test('has CSRF token field', async () => {
    const form = createContactForm(request, {});
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal(request.view.csrfToken);
  });

  test('has a title field', async () => {
    const form = createContactForm(request, {});
    const field = findField(form, 'title');
    expect(field).to.exist();
  });

  test('has a firstName field', async () => {
    const form = createContactForm(request, {});
    const field = findField(form, 'firstName');
    expect(field).to.exist();
  });
  test('has a middleInitials field', async () => {
    const form = createContactForm(request, {});
    const field = findField(form, 'middleInitials');
    expect(field).to.exist();
  });
  test('has a lastName field', async () => {
    const form = createContactForm(request, {});
    const field = findField(form, 'lastName');
    expect(field).to.exist();
  });
  test('has a suffix field', async () => {
    const form = createContactForm(request, {});
    const field = findField(form, 'suffix');
    expect(field).to.exist();
  });
  test('has a department field', async () => {
    const form = createContactForm(request, {});
    const field = findField(form, 'department');
    expect(field).to.exist();
  });
  test('has a submit button', async () => {
    const form = createContactForm(request, {});
    const button = findButton(form);
    expect(button.options.label).to.equal('Continue');
  });
});

experiment('invoice-accounts/forms/create-contact schema', () => {
  experiment('csrf token', () => {
    test('validates for a uuid', async () => {
      const result = createContactFormSchema(createRequest()).csrf_token.validate(uuid());
      expect(result.error).to.be.null();
    });

    test('fails for a string that is not a uuid', async () => {
      const result = createContactFormSchema(createRequest()).csrf_token.validate('noodles');
      expect(result.error).to.exist();
    });
  });

  experiment('title', () => {
    test('should allow string', async () => {
      const result = Joi.describe(createContactFormSchema(createRequest()));
      expect(result.children.title.valids).to.equal(['']);
    });

    test('does not fail if blank', async () => {
      const result = createContactFormSchema(createRequest()).title.validate('');
      expect(result.error).to.equal(null);
    });
  });

  experiment('firtsName', () => {
    test('should allow string', async () => {
      const result = Joi.describe(createContactFormSchema(createRequest()));
      expect(result.children.firstName.invalids).to.equal(['']);
    });

    test('fails if blank', async () => {
      const result = createContactFormSchema(createRequest()).firstName.validate('');
      expect(result.error).to.exist();
    });
  });

  experiment('middleInitials', () => {
    test('should allow string', async () => {
      const result = Joi.describe(createContactFormSchema(createRequest()));
      expect(result.children.middleInitials.valids).to.equal(['']);
    });

    test('does not fail if blank', async () => {
      const result = createContactFormSchema(createRequest()).middleInitials.validate('');
      expect(result.error).to.equal(null);
    });
  });

  experiment('lastName', () => {
    test('should allow string', async () => {
      const result = Joi.describe(createContactFormSchema(createRequest()));
      expect(result.children.lastName.invalids).to.equal(['']);
    });

    test('fails if blank', async () => {
      const result = createContactFormSchema(createRequest()).lastName.validate('');
      expect(result.error).to.exist();
    });
  });

  experiment('suffix', () => {
    test('should allow string', async () => {
      const result = Joi.describe(createContactFormSchema(createRequest()));
      expect(result.children.suffix.valids).to.equal(['']);
    });

    test('does not fail if blank', async () => {
      const result = createContactFormSchema(createRequest()).suffix.validate('');
      expect(result.error).to.equal(null);
    });
  });

  experiment('department', () => {
    test('should allow string', async () => {
      const result = Joi.describe(createContactFormSchema(createRequest()));
      expect(result.children.department.valids).to.equal(['']);
    });

    test('does not fail if blank', async () => {
      const result = createContactFormSchema(createRequest()).department.validate('');
      expect(result.error).to.equal(null);
    });
  });
});
