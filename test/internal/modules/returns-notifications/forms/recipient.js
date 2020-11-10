'use strict';

const { expect } = require('@hapi/code');
const Joi = require('@hapi/joi');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const uuid = require('uuid/v4');
const formContainer = require('internal/modules/returns-notifications/forms/recipient');

const document = {
  document: {
    licenceNumber: '01/234/ABC'
  }
};

const request = {
  path: 'returns-notifications/test-document-id/select-returns',
  view: {
    csrfToken: uuid()
  },
  pre: {
    document
  }
};

experiment('internal/modules/returns-notifications/forms/recipient', () => {
  experiment('.form', () => {
    let form;
    beforeEach(async () => {
      form = formContainer.form(request);
    });

    test('contains a text field for the full name', async () => {
      const field = form.fields.find(field => field.name === 'fullName');
      expect(field.options.caption).to.equal('Licence 01/234/ABC');
      expect(field.options.label).to.equal('Who should receive the form?');
      expect(field.options.hint).to.equal('Enter full name');
    });

    test('contains a "continue" button', async () => {
      const field = form.fields.find(field => field.options.widget === 'button');
      expect(field.options.label).to.equal('Continue');
    });

    test('contains a "csrf_token" field', async () => {
      const field = form.fields.find(field => field.name === 'csrf_token');
      expect(field.value).to.equal(request.view.csrfToken);
    });
  });

  experiment('.schema', () => {
    let schema;
    beforeEach(async () => {
      schema = formContainer.schema(request);
    });

    test('validates when a full name is supplied', async () => {
      const { error } = Joi.validate({
        csrf_token: request.view.csrfToken,
        fullName: 'Test Person'
      }, schema);
      expect(error).to.be.null();
    });

    test('fails validation when the full name is empty', async () => {
      const { error } = Joi.validate({
        csrf_token: request.view.csrfToken,
        fullName: ''
      }, schema);
      expect(error).to.not.be.null();
    });
  });
});
