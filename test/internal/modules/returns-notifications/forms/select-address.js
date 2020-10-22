'use strict';
const { expect } = require('@hapi/code');
const Joi = require('@hapi/joi');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const uuid = require('uuid/v4');
const formContainer = require('internal/modules/returns-notifications/forms/select-address');
const helpers = require('../helpers');

const request = {
  path: 'returns-notifications/test-document-id/select-returns',
  view: {
    csrfToken: uuid()
  }
};

const document = {
  document: {
    licenceNumber: '01/234/ABC',
    roles: [
      helpers.createRole({ roleName: 'licenceHolder' }),
      helpers.createRole({ roleName: 'returnsTo' })
    ]
  },
  selectedRole: 'returnsTo'
};

experiment('internal/modules/returns-notifications/forms/select-address', () => {
  experiment('.form', () => {
    let form;
    beforeEach(async () => {
      form = formContainer.form(request, document);
    });

    test('contains a radio field for the addresses', async () => {
      const radio = form.fields.find(field => field.name === 'selectedRole');
      expect(radio.options.caption).to.equal('Licence 01/234/ABC');
      expect(radio.options.label).to.equal('Select where to send the form');
      expect(radio.options.heading).to.equal(true);
    });

    test('the first radio option is for the licence holder', async () => {
      const radio = form.fields.find(field => field.name === 'selectedRole');
      const [choice] = radio.options.choices;
      expect(choice.value).to.equal('licenceHolder');
      expect(choice.label).to.equal('TEST WATER CO LTD, BUTTERCUP ROAD, DAISY LANE, TESTINGLY, TESTINGTON, TESTINGSHIRE, TT1 1TT');
      expect(choice.hint).to.equal('Licence holder');
      expect(choice.selected).to.be.false();
    });

    test('the second radio option is for the returns to contact, and is selected', async () => {
      const radio = form.fields.find(field => field.name === 'selectedRole');
      const [, choice] = radio.options.choices;
      expect(choice.value).to.equal('returnsTo');
      expect(choice.label).to.equal('TEST WATER CO LTD, BUTTERCUP ROAD, DAISY LANE, TESTINGLY, TESTINGTON, TESTINGSHIRE, TT1 1TT');
      expect(choice.hint).to.equal('Returns contact');
      expect(choice.selected).to.be.true();
    });

    test('the third radio option is a divider', async () => {
      const radio = form.fields.find(field => field.name === 'selectedRole');
      const [,, choice] = radio.options.choices;
      expect(choice.divider).to.equal('Or');
    });

    test('the fourth radio option is to create a one-time address', async () => {
      const radio = form.fields.find(field => field.name === 'selectedRole');
      const [,,, choice] = radio.options.choices;
      expect(choice.label).to.equal('Set up a one time address');
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
      schema = formContainer.schema(request, document);
    });

    test('validates when the selected role is supplied', async () => {
      const { error } = Joi.validate({
        csrf_token: request.view.csrfToken,
        selectedRole: 'licenceHolder'
      }, schema);
      expect(error).to.be.null();
    });

    test('fails validation when the selectedRole is invalid', async () => {
      const { error } = Joi.validate({
        csrf_token: request.view.csrfToken,
        selectedRole: 'not-a-real-role'
      }, schema);
      expect(error).to.not.be.null();
    });

    test('fails validation when the selectedRole is not supplied', async () => {
      const { error } = Joi.validate({
        csrf_token: request.view.csrfToken
      }, schema);
      expect(error).to.not.be.null();
    });
  });
});
