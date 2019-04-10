const { expect } = require('code');
const { find } = require('lodash');
const { experiment, test, beforeEach } = exports.lab = require('lab').script();
const faoForm = require('../../../../src/modules/add-licences/forms/for-attention-of');

experiment('faoForm', () => {
  let form, request;

  beforeEach(async () => {
    request = {
      view: {
        csrfToken: 'xyz'
      },
      sessionStore: {
        data: {
          address: '1234'
        }
      }
    };

    form = faoForm(request);
  });

  test('should contain the correct fields', async () => {
    const names = form.fields.map(row => row.name).filter(x => x);
    expect(names).to.include(['csrf_token', 'fao', 'address']);
  });

  test('should include the CSRF token from the request', async () => {
    const csrf = find(form.fields, { name: 'csrf_token' });
    expect(csrf.value).to.equal(request.view.csrfToken);
  });

  test('should include the address from the request', async () => {
    const address = find(form.fields, { name: 'address' });
    expect(address.value).to.equal(request.sessionStore.data.address);
  });

  test('has a continue button', async () => {
    const button = form.fields.find(f => {
      return f.options.widget === 'button' && f.options.label === 'Continue';
    });
    expect(button).to.exist();
  });
});
