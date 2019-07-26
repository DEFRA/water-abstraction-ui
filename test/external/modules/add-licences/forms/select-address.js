const { expect } = require('@hapi/code');
const { find } = require('lodash');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { selectAddressForm } = require('external/modules/add-licences/forms/select-address');
const sandbox = require('sinon').createSandbox();

experiment('selectAddressForm', () => {
  let form, request, licences;

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

    licences = [{
      metadata: {
        AddressLine1: 'one',
        AddressLine2: 'two',
        AddressLine3: 'three',
        AddressLine4: 'four',
        Town: 'town',
        County: 'county',
        Postcode: 'postcode'
      }
    }];

    form = selectAddressForm(request, licences);
  });

  test('should contain the correct fields', async () => {
    const names = form.fields.map(row => row.name).filter(x => x);
    expect(names).to.include(['csrf_token', 'selectedAddressId']);
  });

  test('should include the CSRF token from the request', async () => {
    const csrf = find(form.fields, { name: 'csrf_token' });
    expect(csrf.value).to.equal(request.view.csrfToken);
  });

  test('has a continue button', async () => {
    const button = form.fields.find(f => {
      return f.options.widget === 'button' && f.options.label === 'Continue';
    });
    expect(button).to.exist();
  });
});
