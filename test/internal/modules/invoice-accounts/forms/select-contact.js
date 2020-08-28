'use strict';

const Joi = require('@hapi/joi');
const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const { selectContactForm, selectContactFormSchema } = require('internal/modules/invoice-accounts/forms/select-contact');
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

const contacts = [
  {
    id: 'test-id-1',
    firtName: 'Name1',
    lastName: 'Surname1'
  },
  {
    id: 'test-id-2',
    firtName: 'Name2',
    lastName: 'Surname2'
  }
];

experiment('invoice-accounts/forms/select-contact form', () => {
  let request;

  beforeEach(async => {
    request = createRequest();
  });
  test('sets the form method to POST', async () => {
    const form = selectContactForm(request, contacts, {});
    expect(form.method).to.equal('POST');
  });

  test('has CSRF token field', async () => {
    const form = selectContactForm(request, contacts, {});
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal(request.view.csrfToken);
  });

  test('has a selectedContact field', async () => {
    const form = selectContactForm(request, contacts, {});
    const selectedContact = findField(form, 'selectedContact');
    expect(selectedContact).to.exist();
  });
  test('has a department field', async () => {
    const form = selectContactForm(request, contacts, {});
    const department = findField(form.fields[0].options.choices[4], 'department');
    expect(department).to.exist();
  });

  test('has a submit button', async () => {
    const form = selectContactForm(request, contacts, {});
    const button = findButton(form);
    expect(button.options.label).to.equal('Continue');
  });
  test('has the correct items in the radio selection field', async () => {
    const form = selectContactForm(request, contacts, {});
    expect(form.fields[0].options.choices.length).to.equal(5);
    expect(form.fields[0].options.choices[2]).to.equal({ divider: 'or' });
    expect(form.fields[0].options.choices[3].label).to.equal('Add a new person');
    expect(form.fields[0].options.choices[4].label).to.equal('Add a new department');
  });
});

experiment('invoice-accounts/forms/select-contact schema', () => {
  experiment('csrf token', () => {
    test('validates for a uuid', async () => {
      const result = selectContactFormSchema(createRequest()).csrf_token.validate(uuid());
      expect(result.error).to.be.null();
    });

    test('fails for a string that is not a uuid', async () => {
      const result = selectContactFormSchema(createRequest()).csrf_token.validate('noodles');
      expect(result.error).to.exist();
    });
  });

  experiment('selected contact', () => {
    test('It should only allow uuid, person, or department', async () => {
      const result = Joi.describe(selectContactFormSchema(createRequest()));
      expect(result.children.selectedContact.valids).to.equal(['person', 'department', Joi.string().uuid()]);
    });

    test('fails if blank', async () => {
      const result = selectContactFormSchema(createRequest()).selectedContact.validate();
      expect(result.error).to.exist();
    });
  });

  experiment('department text field', () => {
    test('is not required if a person has been selected', async () => {
      const data = {
        csrf_token: uuid(),
        selectedContact: 'person'
      };

      const result = Joi.validate(data, selectContactFormSchema());
      expect(result.error).not.to.exist();
    });

    test('is not required if an existing contact has been selected', async () => {
      const data = {
        csrf_token: uuid(),
        selectedContact: uuid()
      };
      const result = Joi.validate(data, selectContactFormSchema());
      expect(result.error).not.to.exist();
    });
    test('is valid if a department name is entered', async () => {
      const data = {
        csrf_token: uuid(),
        selectedContact: 'department',
        department: 'department name'
      };
      const result = Joi.validate(data, selectContactFormSchema());
      expect(result.error).not.to.exist();
    });

    test('fails if no department name has been entered', async () => {
      const data = {
        csrf_token: uuid(),
        selectedContact: 'department',
        department: ''
      };
      const result = Joi.validate(data, selectContactFormSchema());
      expect(result.error).to.exist();
    });
  });
});
