'use strict';
const { expect } = require('@hapi/code');
const Joi = require('@hapi/joi');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const uuid = require('uuid/v4');
const formContainer = require('internal/modules/returns-notifications/forms/select-licence-holders');
const helpers = require('../helpers');

const state = {
  '00000000-0000-0000-0000-000000000001': {
    document: {
      id: '00000000-0000-0000-0000-000000000001',
      dateRange: {
        startDate: '2018-01-02',
        endDate: null
      },
      roles: [
        helpers.createRole({ roleName: 'licenceHolder' })
      ]
    },
    licence: {
      id: '00000000-0000-0000-0000-00000000000a',
      licenceNumber: 'A'
    },
    isSelected: true
  },
  '00000000-0000-0000-0000-000000000002': {
    document: {
      id: '00000000-0000-0000-0000-000000000002',
      dateRange: {
        startDate: '2016-01-01',
        endDate: '2018-01-01'
      },
      roles: [
        helpers.createRole({ roleName: 'licenceHolder', endDate: '2018-01-01' })
      ]
    },
    licence: {
      id: '00000000-0000-0000-0000-00000000000a',
      licenceNumber: 'A'
    },
    isSelected: false
  },
  '00000000-0000-0000-0000-000000000003': {
    document: {
      id: '00000000-0000-0000-0000-000000000003',
      dateRange: {
        startDate: '2018-01-02',
        endDate: null
      },
      roles: [
        helpers.createRole({ roleName: 'licenceHolder' })
      ]
    },
    licence: {
      id: '00000000-0000-0000-0000-00000000000b',
      licenceNumber: 'b'
    }
  }
};

const request = {
  path: 'returns-notifications/test-document-id/select-returns',
  view: {
    csrfToken: uuid()
  },
  pre: {
    state
  }
};

experiment('internal/modules/returns-notifications/forms/select-licence-holders', () => {
  experiment('.form', () => {
    let form;
    beforeEach(async () => {
      form = formContainer.form(request);
    });

    test('contains 3 fields', async () => {
      expect(form.fields).to.be.an.array().length(3);
    });

    test('contains a checkbox field for licences with many documents', async () => {
      const field = form.fields.find(field => field.options.widget === 'checkbox');
      expect(field.name).to.equal('licence_00000000-0000-0000-0000-00000000000a');
      expect(field.options.label).to.equal('Licence A');
      expect(field.options.subHeading).to.equal(true);
    });

    test('the checkboxes are pre-selected when the isSelected flag is set on the document in the state object', async () => {
      const field = form.fields.find(field => field.options.widget === 'checkbox');
      expect(field.value).to.equal([
        '00000000-0000-0000-0000-000000000001'
      ]);
    });

    test('the checkbox contains fields for each CRM v2 document', async () => {
      const { options: { choices } } = form.fields.find(field => field.options.widget === 'checkbox');
      expect(choices).to.be.an.array().length(2);
      expect(choices[0]).to.equal({
        value: '00000000-0000-0000-0000-000000000001',
        label: 'TEST WATER CO LTD',
        hint: 'Current licence holder'
      });
      expect(choices[1]).to.equal({
        value: '00000000-0000-0000-0000-000000000002',
        label: 'TEST WATER CO LTD',
        hint: false
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

    test('validates when no documents are selected', async () => {
      const { error } = Joi.validate({
        csrf_token: request.view.csrfToken,
        'licence_00000000-0000-0000-0000-00000000000a': []
      }, schema);
      expect(error).to.be.null();
    });

    test('validates when one or more valid documents are selected', async () => {
      const { error } = Joi.validate({
        csrf_token: request.view.csrfToken,
        'licence_00000000-0000-0000-0000-00000000000a': ['00000000-0000-0000-0000-000000000001']
      }, schema);
      expect(error).to.be.null();
    });

    test('fails validation for an unexpected document', async () => {
      const { error } = Joi.validate({
        csrf_token: request.view.csrfToken,
        'licence_00000000-0000-0000-0000-00000000000a': ['00000000-0000-0000-0000-000000000999']
      }, schema);
      expect(error).to.not.be.null();
    });

    test('fails validation for an unexpected licence', async () => {
      const { error } = Joi.validate({
        csrf_token: request.view.csrfToken,
        'licence_00000000-0000-0000-0000-00000000000x': ['00000000-0000-0000-0000-000000000001']
      }, schema);
      expect(error).to.not.be.null();
    });
  });
});
