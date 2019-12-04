const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { form: confirmForm } = require('internal/modules/returns/forms/confirm.js');

const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  }
});

experiment('internal confirmation form', () => {
  let request, form;
  beforeEach(async () => {
    request = createRequest();
    form = confirmForm(request, { isUnderQuery: true });
  });

  test('should be a POST form', async () => {
    expect(form.method).to.equal('POST');
  });

  test('has CSRF token field', async () => {
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal('token');
  });

  test('has under query checkbox', async () => {
    const underQuery = findField(form, 'isUnderQuery');
    expect(underQuery.options.widget).to.equal('checkbox');
    expect(underQuery.options.choices[0].label).to.equal(
      'Mark as under query'
    );
  });

  test('it should be checked if isUnderQuery true', async () => {
    const underQuery = findField(form, 'isUnderQuery');
    expect(underQuery.value).to.equal(['under_query']);
  });

  test('it should not be checked if isUnderQuery true', async () => {
    form = confirmForm(request, { isUnderQuery: false });
    const underQuery = findField(form, 'isUnderQuery');
    expect(underQuery.value).to.equal([]);
  });

  test('has a submit button', async () => {
    const button = findButton(form);
    expect(button.options.label).to.equal('Submit');
  });
});
