require('dotenv').config();
const Lab = require('lab');
const { expect } = require('code');
const { find } = require('lodash');
const { selectSchemaForm } = require('../../../../src/modules/abstraction-reform/forms/select-schema');
const { wr22 } = require('../../../../src/modules/abstraction-reform/lib/schema');

const lab = exports.lab = Lab.script();

const request = {
  view: {
    csrfToken: '4a0b2424-6c02-45a5-9935-70a4c41538d2'
  },
  params: {
    documentId: '76288bd8-5d26-4b49-b7cc-b4ba8d3fb3c4'
  }
};

lab.experiment('selectSchemaForm', () => {
  let form;

  lab.beforeEach(async () => {
    form = selectSchemaForm(request, wr22);
  });

  lab.test('The form action should have the correct action', async () => {
    expect(form.action).to.equal(`/admin/abstraction-reform/licence/${request.params.documentId}/select-schema`);
  });

  lab.test('The form should have a CSRF token field', async () => {
    const field = find(form.fields, { name: 'csrf_token' });
    expect(field.value).to.equal(request.view.csrfToken);
  });

  lab.test('The form should have a schema radio field', async () => {
    const field = find(form.fields, { name: 'schema' });
    expect(field.options.choices).to.be.an.array();
    expect(field.options.widget).to.equal('radio');

    for (let choice of field.options.choices) {
      expect(Object.keys(choice)).to.equal(['value', 'label', 'hint']);
    }
  });
});

exports.lab = lab;
