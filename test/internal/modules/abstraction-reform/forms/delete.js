require('dotenv').config();
const Lab = require('lab');
const { expect } = require('code');
const { find } = require('lodash');
const { deleteForm } = require('internal/modules/abstraction-reform/forms/delete');
const { getWR22 } = require('internal/modules/abstraction-reform/lib/schema');

const lab = exports.lab = Lab.script();

const request = {
  view: {
    csrfToken: '4a0b2424-6c02-45a5-9935-70a4c41538d2'
  },
  params: {
    documentId: '76288bd8-5d26-4b49-b7cc-b4ba8d3fb3c4',
    id: 'bfecf668-b4ec-4046-85f5-d787d1b1d973'
  }
};

lab.experiment('delete WR22 condition form', () => {
  let form;

  lab.beforeEach(async () => {
    const wr22 = getWR22();
    form = deleteForm(request, wr22);
  });

  lab.test('The form action should have the correct action', async () => {
    expect(form.action).to.equal(`/digitise/licence/${request.params.documentId}/delete/${request.params.id}`);
  });

  lab.test('The form should have a CSRF token field', async () => {
    const field = find(form.fields, { name: 'csrf_token' });
    expect(field.value).to.equal(request.view.csrfToken);
  });
});

exports.lab = lab;
