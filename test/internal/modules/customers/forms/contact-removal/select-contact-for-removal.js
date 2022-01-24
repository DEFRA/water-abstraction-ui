'use strict';

const { v4: uuid } = require('uuid');
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const session = require('../../../../../../src/internal/modules/customers/session.js');
const selectContactForRemoval = require('internal/modules/customers/forms/contact-removal/select-contact-for-removal');
const { findField, findButton, findWarningText } = require('../../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: uuid()
  }
});

experiment('internal/modules/customers/forms/contact-removal/select-contact-for-removal', () => {
  let request;

  afterEach(() => sandbox.restore());

  experiment('.form', () => {
    beforeEach(() => {
      request = createRequest();
    });

    experiment(' with no contacts for removal', () => {
      beforeEach(() => {
        sandbox.stub(session, 'get').returns({ companyContactsForRemoval: [] });
      });

      test('sets the form method to POST', async () => {
        const form = selectContactForRemoval.form(request, {});
        expect(form.method).to.equal('POST');
      });

      test('has CSRF token field', async () => {
        const form = selectContactForRemoval.form(request, {});
        const csrf = findField(form, 'csrf_token');
        expect(csrf.value).to.equal(request.view.csrfToken);
      });

      test('has no submit button when there are no contacts for removal', async () => {
        const form = selectContactForRemoval.form(request, {});
        expect(findButton(form)).to.not.exist();
      });
    });

    experiment(' with contacts for removal', () => {
      const companyContactsForRemoval = [{ name: 'FRED', companyContactId: uuid() }];

      test('has a submit button when there are contacts for removal', async () => {
        sandbox.stub(session, 'get').returns({ companyContactsForRemoval });
        const form = selectContactForRemoval.form(request, {});
        const button = findButton(form);
        expect(button.options.label).to.equal('Continue');
      });

      test('has a radio button for each contact that can be selected for removal', async () => {
        sandbox.stub(session, 'get').returns({ companyContactsForRemoval });
        const form = selectContactForRemoval.form(request, {});
        const field = findField(form, 'companyContactId');
        expect(field.options.choices).to.equal(companyContactsForRemoval.map(contact => ({ label: contact.name, value: contact.companyContactId })));
      });

      test('has a the correct warning when both nald and billing contacts exist', async () => {
        sandbox.stub(session, 'get').returns({ companyContactsForRemoval, naldContactsExist: true, billingContactsExist: true });
        const form = selectContactForRemoval.form(request, {});
        const field = findWarningText(form);
        expect(field.options.text).to.equal('Only additional contacts can be removed from this customer');
      });

      test('has no warning when neither billing or nald contacts exist', async () => {
        sandbox.stub(session, 'get').returns({ companyContactsForRemoval, naldContactsExist: false, billingContactsExist: false });
        const form = selectContactForRemoval.form(request, {});
        expect(findWarningText(form)).to.not.exist();
      });
    });
  });

  experiment('.schema', () => {
    test('validates when data is valid', () => {
      const result = selectContactForRemoval.schema(request).validate({
        companyContactId: uuid(),
        csrf_token: uuid()
      });
      expect(result.error).to.not.exist();
    });

    experiment('csrf token', () => {
      test('fails if the csrf token is not a uuid', async () => {
        const result = selectContactForRemoval.schema(request).validate({
          companyContactId: uuid(),
          csrf_token: 'noodles'
        });
        expect(result.error.message).to.equal('"csrf_token" must be a valid GUID');
      });
    });

    experiment('department', () => {
      test('fails if the company contact id is not a uuid', async () => {
        const result = selectContactForRemoval.schema(request).validate({
          companyContactId: 'noodles',
          csrf_token: uuid()
        });
        expect(result.error.message).to.equal('"companyContactId" must be a valid GUID');
      });
    });
  });
});
