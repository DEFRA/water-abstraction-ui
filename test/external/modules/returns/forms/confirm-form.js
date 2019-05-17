const { find } = require('lodash');
const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();
const confirmForm = require('../../../../../src/external/modules/returns/forms/confirm');
const { scope } = require('../../../../../src/external/lib/constants');

experiment('confirmForm', () => {
  const getRequest = (isInternal) => {
    return {
      auth: {
        credentials: {
          scope: [isInternal ? scope.internal : scope.external]
        }
      },
      view: {
        csrfToken: 'xyz'
      },
      query: {
        returnId: 'abc'
      }
    };
  };

  const externalForm = confirmForm(getRequest(false), {});
  const internalForm = confirmForm(getRequest(true), {});

  test('it should have an external action URL for external users', async () => {
    expect(externalForm.action).to.equal('/return/nil-return?returnId=abc');
  });

  test('it should have a CSRF token', async () => {
    const csrf = find(externalForm.fields, { name: 'csrf_token' });
    expect(csrf.value).to.equal('xyz');
  });

  test('it should have an internal action URL for internal users', async () => {
    expect(internalForm.action).to.equal('/admin/return/nil-return?returnId=abc');
  });

  test('it should not include under query checkbox for external users', async () => {
    const fieldNames = externalForm.fields.map(field => field.name);
    expect(fieldNames).to.equal(['csrf_token', null]);
  });

  test('it should include under query checkbox for internal users', async () => {
    const fieldNames = internalForm.fields.map(field => field.name);
    expect(fieldNames).to.equal(['csrf_token', 'isUnderQuery', null]);
  });

  test('it should not be checked if isUnderQuery flag is false', async () => {
    const request = getRequest(true);
    const form = confirmForm(request, { isUnderQuery: false });
    const checkbox = find(form.fields, { name: 'isUnderQuery' });
    expect(checkbox.value).to.equal([]);
  });

  test('it should be checked if isUnderQuery flag is true', async () => {
    const request = getRequest(true);
    const form = confirmForm(request, { isUnderQuery: true });
    const checkbox = find(form.fields, { name: 'isUnderQuery' });
    expect(checkbox.value).to.equal(['under_query']);
  });
});
