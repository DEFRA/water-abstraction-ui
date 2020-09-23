'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { deleteAgreementForm } = require('internal/modules/agreements/forms/delete-agreement');
const { findField, findButton } = require('../../../../lib/form-test');

const csrfToken = 'c5afe238-fb77-4131-be80-384aaf245842';

const createRequest = (query = {}) => ({
  view: {
    csrfToken
  },
  pre: {
    licence: { id: 'test-licence-id' },
    agreement: { id: 'test-agreement-id' }
  }
});

experiment('internal/modules/agreements/forms/delete-agreement', () => {
  experiment('.form', () => {
    let form;
    beforeEach(() => {
      form = deleteAgreementForm(createRequest());
    });

    test('sets the form method to POST', async () => {
      expect(form.method).to.equal('POST');
    });

    test('sets the correct action', async () => {
      expect(form.action).to.equal('/licences/test-licence-id/agreements/test-agreement-id/delete');
    });

    test('has CSRF token field', async () => {
      const csrf = findField(form, 'csrf_token');
      expect(csrf.value).to.equal(csrfToken);
    });

    test('has the correct button', async () => {
      const button = findButton(form);
      expect(button.options.label).to.equal('Delete agreement');
    });
  });
});
