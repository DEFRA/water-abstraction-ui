'use strict';

const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const createContact = require('internal/modules/contact-entry/forms/create-contact');
const helpers = require('internal/modules/contact-entry/lib/helpers');
const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: uuid()
  }
});

experiment('internal/modules/contact-entry/forms/create-contact', () => {
  let request;
  beforeEach(async => {
    request = createRequest();

    sandbox.stub(helpers, 'getContactFromSession').returns({
      title: 'Lance Corporal',
      firstName: 'Valtteri',
      lastName: 'Bottas'
    });
  });

  afterEach(() => sandbox.restore());

  experiment('.form', () => {
    test('sets the form method to POST', async () => {
      const form = createContact.form(request, {});
      expect(form.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const form = createContact.form(request, {});
      const csrf = findField(form, 'csrf_token');
      expect(csrf.value).to.equal(request.view.csrfToken);
    });

    test('has a title field', async () => {
      const form = createContact.form(request, {});
      const field = findField(form, 'title');
      expect(field).to.exist();
    });

    test('has a firstName field', async () => {
      const form = createContact.form(request, {});
      const field = findField(form, 'firstName');
      expect(field).to.exist();
    });
    test('has a middleInitials field', async () => {
      const form = createContact.form(request, {});
      const field = findField(form, 'middleInitials');
      expect(field).to.exist();
    });
    test('has a lastName field', async () => {
      const form = createContact.form(request, {});
      const field = findField(form, 'lastName');
      expect(field).to.exist();
    });
    test('has a suffix field', async () => {
      const form = createContact.form(request, {});
      const field = findField(form, 'suffix');
      expect(field).to.exist();
    });
    test('has a department field', async () => {
      const form = createContact.form(request, {});
      const field = findField(form, 'department');
      expect(field).to.exist();
    });
    test('has a submit button', async () => {
      const form = createContact.form(request, {});
      const button = findButton(form);
      expect(button.options.label).to.equal('Continue');
    });

    test('populates expected fields with data', () => {
      const form = createContact.form(request, {});
      const titleField = findField(form, 'title');
      const firstNameField = findField(form, 'firstName');
      const lastNameField = findField(form, 'lastName');
      expect(titleField.value).to.equal('Lance Corporal');
      expect(firstNameField.value).to.equal('Valtteri');
      expect(lastNameField.value).to.equal('Bottas');
    });
  });

  experiment('.schema', () => {
    let data;
    beforeEach(() => {
      data = {
        title: 'Lance Corporal',
        firstName: 'Valtteri',
        middleInitials: 'V',
        lastName: 'Bottas',
        suffix: 'suffix',
        department: 'Mercedes Petronas AMG',
        csrf_token: uuid()
      };
    });

    test('validates when data is valid', () => {
      const result = createContact.schema(request).validate(data);
      expect(result.error).to.be.null();
    });

    experiment('csrf token', () => {
      test('fails for a string that is not a uuid', async () => {
        const result = createContact.schema(request).validate({
          ...data,
          csrf_token: 'noodles' });
        expect(result.error).to.exist();
      });
    });

    experiment('title', () => {
      test('does not fail if blank', async () => {
        const result = createContact.schema(request).validate({
          ...data,
          title: ''
        });
        expect(result.error).to.equal(null);
      });
    });

    experiment('firstName', () => {
      test('fails if blank', async () => {
        const result = createContact.schema(request).validate({
          ...data,
          firstName: ''
        });
        expect(result.error).to.exist();
      });
    });

    experiment('middleInitials', () => {
      test('does not fail if blank', async () => {
        const result = createContact.schema(request).validate({
          ...data,
          middleInitials: ''
        });
        expect(result.error).to.equal(null);
      });
    });

    experiment('lastName', () => {
      test('fails if blank', async () => {
        const result = createContact.schema(request).validate({
          ...data,
          lastName: ''
        });
        expect(result.error).to.exist();
      });
    });

    experiment('suffix', () => {
      test('does not fail if blank', async () => {
        const result = createContact.schema(request).validate({
          ...data,
          suffix: ''
        });
        expect(result.error).to.equal(null);
      });
    });

    experiment('department', () => {
      test('does not fail if blank', async () => {
        const result = createContact.schema(request).validate({
          ...data,
          department: '' });
        expect(result.error).to.equal(null);
      });
    });
  });
});
