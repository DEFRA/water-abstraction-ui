const { expect } = require('code');
const { find } = require('lodash');
const { experiment, test, beforeEach } = exports.lab = require('lab').script();
const { faoForm } = require('external/modules/add-licences/forms/for-attention-of');
const sandbox = require('sinon').createSandbox();

experiment('faoForm', () => {
  let form, request;

  const addLicenceFlow = {
    selectedAddressId: '1234'
  };

  beforeEach(async () => {
    request = {
      view: {
        csrfToken: 'xyz'
      },
      yar: {
        get: sandbox.stub().returns(addLicenceFlow)
      }
    };

    form = faoForm(request);
  });

  test('should contain the correct fields', async () => {
    const names = form.fields.map(row => row.name).filter(x => x);
    expect(names).to.include(['csrf_token', 'fao', 'selectedAddressId']);
  });

  test('should include the CSRF token from the request', async () => {
    const csrf = find(form.fields, { name: 'csrf_token' });
    expect(csrf.value).to.equal(request.view.csrfToken);
  });

  test('should include the address from the request', async () => {
    const address = find(form.fields, { name: 'selectedAddressId' });
    expect(address.value).to.equal(addLicenceFlow.selectedAddressId);
  });

  test('has a continue button', async () => {
    const button = form.fields.find(f => {
      return f.options.widget === 'button' && f.options.label === 'Continue';
    });
    expect(button).to.exist();
  });
});
