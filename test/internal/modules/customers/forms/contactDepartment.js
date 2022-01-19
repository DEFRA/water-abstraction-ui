'use strict';

const { v4: uuid } = require('uuid');
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const createContact = require('internal/modules/customers/forms/contactDepartment');
const { findField, findButton } = require('../../../../lib/form-test');
const session = require('../../../../../src/internal/modules/customers/session.js');

const createRequest = () => ({
  view: {
    csrfToken: uuid()
  }
});

experiment('internal/modules/customers/forms/contactDepartment', () => {
  let request, departmentFromDatabase;

  beforeEach(() => {
    departmentFromDatabase = 'Cheese';
    sandbox.stub(session, 'get').returns({ departmentFromDatabase });
    request = createRequest();
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

    test('has a department field', async () => {
      const form = createContact.form(request, {});
      const field = findField(form, 'department');
      expect(field).to.exist();
    });

    test('has a submit button', async () => {
      const form = createContact.form(request, {});
      const button = findButton(form);
      expect(button.options.label).to.equal('Confirm');
    });

    test('populates expected fields with data', () => {
      const form = createContact.form(request, {});
      expect(findField(form, 'department').value).to.equal(departmentFromDatabase);
    });
  });

  experiment('.schema', () => {
    test('validates when data is valid', () => {
      const result = createContact.schema(request).validate({
        department: departmentFromDatabase,
        csrf_token: uuid()
      });
      expect(result.error).to.be.undefined();
    });

    experiment('csrf token', () => {
      test('fails for a string that is not a uuid', async () => {
        const result = createContact.schema(request).validate({
          department: departmentFromDatabase,
          csrf_token: 'noodles'
        });
        expect(result.error.message).to.equal('"csrf_token" must be a valid GUID');
      });
    });

    experiment('department', () => {
      test('fails if blank', async () => {
        const result = createContact.schema(request).validate({
          department: '',
          csrf_token: uuid()
        });
        expect(result.error.message).to.equal('"department" is not allowed to be empty');
      });
    });
  });
});
