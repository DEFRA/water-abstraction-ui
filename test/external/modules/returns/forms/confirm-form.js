const { find } = require('lodash');
const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const confirmForm = require('external/modules/returns/forms/confirm').form;
const { scope } = require('external/lib/constants');

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

  test('it should have a CSRF token', async () => {
    const csrf = find(externalForm.fields, { name: 'csrf_token' });
    expect(csrf.value).to.equal('xyz');
  });

  test('it should not include under query checkbox for external users', async () => {
    const fieldNames = externalForm.fields.map(field => field.name);
    expect(fieldNames).to.equal(['csrf_token', null]);
  });
});
