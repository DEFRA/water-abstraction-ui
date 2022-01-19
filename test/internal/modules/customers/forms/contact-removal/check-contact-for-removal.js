'use strict';

const { v4: uuid } = require('uuid');
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const session = require('../../../../../../src/internal/modules/customers/session.js');
const checkContactForRemoval = require('internal/modules/customers/forms/contact-removal/check-contact-for-removal');
const { findField, findButton, findWarningText } = require('../../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: uuid()
  }
});

experiment('internal/modules/customers/forms/contact-removal/check-contact-for-removal', () => {
  let request;

  beforeEach(() => {
    request = createRequest();
  });

  afterEach(() => sandbox.restore());

  experiment('.form', () => {
    experiment('when the last email contact is not being deleted', () => {
      beforeEach(() => {
        sandbox.stub(session, 'get').returns({});
      });

      test('sets the form method to POST', async () => {
        const form = checkContactForRemoval.form(request, {});
        expect(form.method).to.equal('POST');
      });

      test('has CSRF token field', async () => {
        const form = checkContactForRemoval.form(request, {});
        const csrf = findField(form, 'csrf_token');
        expect(csrf.value).to.equal(request.view.csrfToken);
      });

      test('has no warning text', async () => {
        const form = checkContactForRemoval.form(request, {});
        expect(findWarningText(form)).to.not.exist();
      });

      test('has a submit button', async () => {
        const form = checkContactForRemoval.form(request, {});
        const button = findButton(form);
        expect(button.options.label).to.equal('Remove');
      });
    });

    experiment('when the last email contact is to be deleted', () => {
      beforeEach(() => {
        sandbox.stub(session, 'get').returns({ isLastEmailContact: true });
      });

      test('has warning text', async () => {
        const form = checkContactForRemoval.form(request, {});
        const warningText = findWarningText(form);
        expect(warningText.options.text).to.equal('You\'re about to remove the only email contact for this customer. The licence holder will get future water abstraction alerts by post.');
      });
    });
  });

  experiment('.schema', () => {
    test('validates when data is valid', () => {
      const result = checkContactForRemoval.schema(request).validate({
        csrf_token: uuid()
      });
      expect(result.error).to.not.exist();
    });

    experiment('csrf token', () => {
      test('fails if the csrf token is not a uuid', async () => {
        const result = checkContactForRemoval.schema(request).validate({ csrf_token: 'noodles' });
        expect(result.error.message).to.equal('"csrf_token" must be a valid GUID');
      });
    });
  });
});
