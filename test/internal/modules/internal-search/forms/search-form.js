const { expect } = require('code');
const { experiment, test, beforeEach } = exports.lab = require('lab').script();
const { searchForm } = require('../../../../../src/internal/modules/internal-search/forms/search-form');

experiment('searchForm', () => {
  let form;
  beforeEach(async () => {
    form = searchForm();
  });

  test('it should be a GET form', async () => {
    expect(form.method).to.equal('GET');
  });

  test('it should have the correct action', async () => {
    expect(form.action).to.equal('/admin/licences');
  });

  test('it should have a single field named query', async () => {
    const names = form.fields.map(field => field.name);
    expect(names).to.equal(['query']);
  });

  test('A query passed to the function should set the value of the query field', async () => {
    form = searchForm('test');
    expect(form.fields[0].value).to.equal('test');
  });
});
