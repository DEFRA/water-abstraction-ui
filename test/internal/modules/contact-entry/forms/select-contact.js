'use strict';

const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const selectContact = require('internal/modules/contact-entry/forms/select-contact');
const helpers = require('internal/modules/contact-entry/lib/helpers');
const { findField, findButton } = require('../../../../lib/form-test');

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

const createRequest = () => ({
  view: {
    csrfToken: uuid()
  },
  pre: {
    companyContacts: contacts
  }
});

experiment('internal/modules/contact-entry/forms/select-contact', () => {
  let request;
  beforeEach(async => {
    request = createRequest();

    sandbox.stub(helpers, 'getContactFromSession').returns({
      contactId: 'test-id-2'
    });
  });

  afterEach(() => sandbox.restore());

  experiment('.form', () => {
    test('sets the form method to POST', async () => {
      const form = selectContact.form(request, contacts, {});
      expect(form.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const form = selectContact.form(request, contacts, {});
      const csrf = findField(form, 'csrf_token');
      expect(csrf.value).to.equal(request.view.csrfToken);
    });

    test('has a selectedContact field', async () => {
      const form = selectContact.form(request, contacts, {});
      const selectedContact = findField(form, 'selectedContact');
      expect(selectedContact).to.exist();
    });
    test('has a department field', async () => {
      const form = selectContact.form(request, contacts, {});
      const department = findField(form.fields[0].options.choices[4], 'department');
      expect(department).to.exist();
    });

    test('has a submit button', async () => {
      const form = selectContact.form(request, contacts, {});
      const button = findButton(form);
      expect(button.options.label).to.equal('Continue');
    });

    test('has the correct items in the radio selection field', async () => {
      const form = selectContact.form(request, contacts, {});
      expect(form.fields[0].options.choices.length).to.equal(5);
      expect(form.fields[0].options.choices[2]).to.equal({ divider: 'or' });
      expect(form.fields[0].options.choices[3].label).to.equal('Add a new person');
      expect(form.fields[0].options.choices[4].label).to.equal('Add a new department');
    });
  });

  experiment('.schema', () => {
    let data;
    beforeEach(() => {
      data = {
        selectedContact: 'person',
        department: '',
        csrf_token: uuid()
      };
    });

    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = selectContact.schema(request).validate(data);
        expect(result.error).to.be.null();
      });

      test('fails for a string that is not a uuid', async () => {
        const result = selectContact.schema(request).validate({
          ...data,
          csrf_token: 'not-a-guid'
        });
        expect(result.error).to.exist();
      });
    });

    experiment('selected contact', () => {
      test('validates for "person"', async () => {
        const result = selectContact.schema(request).validate(data);
        expect(result.error).to.be.null();
      });

      test('validates for "department"', async () => {
        const result = selectContact.schema(request).validate({
          ...data,
          selectedContact: 'department',
          department: 'Accts payable'
        });
        expect(result.error).to.be.null();
      });

      test('validates for one a contact id from companyContacts array', async () => {
        const result = selectContact.schema(request).validate({
          ...data,
          selectedContact: contacts[1].id
        });
        expect(result.error).to.be.null();
      });

      test('fails for an id that is not in companyContacts array', async () => {
        const result = selectContact.schema(request).validate({
          ...data,
          selectedContact: uuid()
        });
        expect(result.error).to.exist();
      });

      test('fails if blank', async () => {
        delete data.selectedContact;
        const result = selectContact.schema(request).validate(data);
        expect(result.error).to.exist();
      });
    });

    experiment('department text field', () => {
      test('is not required if a person has been selected', async () => {
        const result = selectContact.schema(request).validate(data);
        expect(result.error).not.to.exist();
      });

      test('is not required if an existing contact has been selected', async () => {
        const result = selectContact.schema(request).validate({
          ...data,
          selectedContact: 'test-id-2'
        });
        expect(result.error).not.to.exist();
      });

      test('is valid if a department name is entered', async () => {
        const result = selectContact.schema(request).validate({
          ...data,
          selectedContact: 'department',
          department: 'department name'
        });
        expect(result.error).not.to.exist();
      });

      test('fails if no department name has been entered', async () => {
        const result = selectContact.schema(request).validate({
          ...data,
          selectedContact: 'department'
        });
        expect(result.error).to.exist();
      });
    });
  });
});
