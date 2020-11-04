'use strict';
const { expect } = require('@hapi/code');
const Joi = require('@hapi/joi');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const uuid = require('uuid/v4');
const formContainer = require('internal/modules/returns-notifications/forms/select-returns');
const helpers = require('../helpers');

const document = {
  document: {
    licenceNumber: '01/234/ABC'
  },
  returns: [
    helpers.createReturn()
  ]
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

experiment('internal/modules/returns-notifications/forms/select-returns', () => {
  experiment('.form', () => {
    let form;
    beforeEach(async () => {
      form = formContainer.form(request);
    });

    test('contains a checkbox field for the returns', async () => {
      const checkbox = form.fields.find(field => field.name === 'returnIds');
      expect(checkbox.options.caption).to.equal('Licence 01/234/ABC');
      expect(checkbox.options.label).to.equal('Which returns need a form?');
      expect(checkbox.options.heading).to.equal(true);
      expect(checkbox.options.hint).to.equal('Uncheck any returns reference numbers that do not need a form.');
    });

    test('contains a checkbox control for each return', async () => {
      const checkbox = form.fields.find(field => field.name === 'returnIds');
      const { choices } = checkbox.options;
      expect(choices).to.be.an.array().length(1);
      expect(choices[0]).to.equal({
        value: 'v1:1:01/123/ABC:1234:2020-04-01:2021-03-31',
        label: '1234 Spray Irrigation - Storage',
        hint: 'Due 28 April 2021'
      });
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

    test('validates when return IDs is empty array', async () => {
      const { error } = Joi.validate({
        csrf_token: request.view.csrfToken,
        returnIds: []
      }, schema);
      expect(error).to.be.null();
    });

    test('validates when return IDs contains IDs from document', async () => {
      const { error } = Joi.validate({
        csrf_token: request.view.csrfToken,
        returnIds: [document.returns[0].id]
      }, schema);
      expect(error).to.be.null();
    });

    test('fails validation when return IDs contains IDs not from document', async () => {
      const { error } = Joi.validate({
        csrf_token: request.view.csrfToken,
        returnIds: [document.returns[0].id, 'invalid-id']
      }, schema);
      expect(error).to.not.be.null();
    });
  });
});
