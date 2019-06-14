require('dotenv').config();
const Lab = require('lab');
const { expect } = require('code');
const { find } = require('lodash');
const { selectSchemaCategoryForm } = require('internal/modules/abstraction-reform/forms/select-schema-category');
const { scope } = require('internal/lib/constants');

const lab = exports.lab = Lab.script();

const request = {
  view: {
    csrfToken: '4a0b2424-6c02-45a5-9935-70a4c41538d2'
  },
  params: {
    documentId: '76288bd8-5d26-4b49-b7cc-b4ba8d3fb3c4'
  },
  auth: {
    credentials: {
      scope: [scope.internal]
    }
  }
};

const categories = [
  {
    title: 'Category A',
    slug: 'category-a'
  }, {
    title: 'Category B',
    slug: 'category-b'
  }
];

lab.experiment('selectSchemaCategoryForm', () => {
  let form;

  lab.beforeEach(async () => {
    form = selectSchemaCategoryForm(request, categories);
  });

  lab.test('The form action should have the correct action', async () => {
    expect(form.action).to.equal(`/digitise/licence/${request.params.documentId}/select-schema-category`);
  });

  lab.test('The form should have a CSRF token field', async () => {
    const field = find(form.fields, { name: 'csrf_token' });
    expect(field.value).to.equal(request.view.csrfToken);
  });

  lab.test('The form should have a category radio field', async () => {
    const field = find(form.fields, { name: 'category' });
    expect(field.options.choices).to.be.an.array();
    expect(field.options.widget).to.equal('radio');

    expect(field.options.choices).to.equal([{
      value: categories[0].slug,
      label: categories[0].title
    },
    {
      value: categories[1].slug,
      label: categories[1].title
    }
    ]);
  });
});

exports.lab = lab;
