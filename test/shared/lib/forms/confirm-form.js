'use strict';

const { expect } = require('@hapi/code');
const { test, experiment, beforeEach } = exports.lab = require('@hapi/lab').script();

const confirmForm = require('shared/lib/forms/confirm-form');

experiment('shared/lib/forms/confirm-form.js', () => {
  let request, form;

  experiment('.form', () => {
    beforeEach(async () => {
      request = {
        view: {
          csrfToken: '00000000-0000-0000-0000-000000000000'
        },
        path: '/test/path'
      };
    });

    experiment('when custom button text is not specified', () => {
      beforeEach(async () => {
        form = confirmForm.form(request);
      });

      test('the form has the correct action attribute', async () => {
        expect(form.action).to.equal('/test/path');
      });

      test('the form has the POST method', async () => {
        expect(form.method).to.equal('POST');
      });

      test('the form has 2 fields', async () => {
        expect(form.fields).to.be.an.array().length(2);
      });

      test('the form has a hidden field for the csrf token', async () => {
        const [field] = form.fields;
        expect(field.name).to.equal('csrf_token');
        expect(field.options.type).to.equal('hidden');
        expect(field.value).to.equal(request.view.csrfToken);
      });

      test('the form has a submit button', async () => {
        const [, button] = form.fields;
        expect(button.options.widget).to.equal('button');
        expect(button.options.label).to.equal('Submit');
      });
    });

    experiment('when custom button text is specified', () => {
      beforeEach(async () => {
        form = confirmForm.form(request, 'Do the thing');
      });

      test('the submit button uses the custom text', async () => {
        const [, button] = form.fields;
        expect(button.options.widget).to.equal('button');
        expect(button.options.label).to.equal('Do the thing');
      });
    });

    experiment('when a custom path string is supplied as the third argument', () => {
      beforeEach(async () => {
        form = confirmForm.form(request, 'Do the thing', '/custom/path');
      });

      test('the submit button uses the custom text', async () => {
        const [, button] = form.fields;
        expect(button.options.widget).to.equal('button');
        expect(button.options.label).to.equal('Do the thing');
      });

      test('the form action is that supplied', async () => {
        expect(form.action).to.equal('/custom/path');
      });
    });

    experiment('when an options object is supplied as the third argument', () => {
      beforeEach(async () => {
        form = confirmForm.form(request, 'Do the thing', {
          action: '/custom/path',
          isWarning: true
        });
      });

      test('the submit button uses the custom text', async () => {
        const [, button] = form.fields;
        expect(button.options.widget).to.equal('button');
        expect(button.options.label).to.equal('Do the thing');
      });

      test('the submit button has a warning class', async () => {
        const [, button] = form.fields;
        expect(button.options.controlClass).to.equal('govuk-button--warning');
      });

      test('the form action is that supplied', async () => {
        expect(form.action).to.equal('/custom/path');
      });
    });
    experiment('when having extra fields', () => {
      beforeEach(async () => {
        form = confirmForm.form(request, 'Submit', { originalInvoiceId: 'adff877f-2bc0-45e8-b26e-c945259ca284', rebillInvoiceId: 'a96ea8b2-9454-4d09-af02-54747df48a39' });
      });

      test('the form has the POST method', async () => {
        expect(form.method).to.equal('POST');
      });

      test('the form has 4 fields', async () => {
        expect(form.fields).to.be.an.array().length(4);
      });

      test('the form has a hidden field for the csrf token', async () => {
        const [field] = form.fields;
        expect(field.name).to.equal('csrf_token');
        expect(field.options.type).to.equal('hidden');
        expect(field.value).to.equal(request.view.csrfToken);
      });

      test('the form has a originalInvoiceId field', async () => {
        const [, originalInvoiceId] = form.fields;
        expect(originalInvoiceId.name).to.equal('originalInvoiceId');
        expect(originalInvoiceId.value).to.equal('adff877f-2bc0-45e8-b26e-c945259ca284');
        expect(originalInvoiceId.options.type).to.equal('hidden');
      });

      test('the form has a rebillInvoiceId field', async () => {
        const [, originalInvoiceId, rebillInvoiceId] = form.fields;
        expect(originalInvoiceId.name).to.equal('originalInvoiceId');
        expect(rebillInvoiceId.name).to.equal('rebillInvoiceId');
        expect(rebillInvoiceId.value).to.equal('a96ea8b2-9454-4d09-af02-54747df48a39');
        expect(rebillInvoiceId.options.type).to.equal('hidden');
      });
    });
  });
});
