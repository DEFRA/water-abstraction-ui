const { find } = require('lodash');
const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();
const confirmForm = require('../../../../../src/external/modules/returns/forms/confirm');
const { scope } = require('../../../../../src/external/lib/constants');

experiment('confirmForm', () => {
  const getRequest = () => {
    return {
      auth: {
        credentials: {
          scope: [scope.external]
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

  const externalForm = confirmForm(getRequest(), {});

  test('it should have an external action URL for external users', async () => {
    expect(externalForm.action).to.equal('/return/nil-return?returnId=abc');
  });

  test('it should have a CSRF token', async () => {
    const csrf = find(externalForm.fields, { name: 'csrf_token' });
    expect(csrf.value).to.equal('xyz');
  });

  test('it should not include under query checkbox for external users', async () => {
    const fieldNames = externalForm.fields.map(field => field.name);
    expect(fieldNames).to.equal(['csrf_token', null]);
  });
});
