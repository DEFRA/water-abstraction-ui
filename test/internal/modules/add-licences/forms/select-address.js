const { expect } = require('code');
const { find } = require('lodash');
const { experiment, test, beforeEach } = exports.lab = require('lab').script();
const { selectAddressForm } = require('../../../../../src/internal/modules/add-licences/forms/select-address');

experiment('selectAddressForm', () => {
  let form, request, licences;

  beforeEach(async () => {
    request = {
      view: {
        csrfToken: 'xyz'
      },
      sessionStore: {
        data: {
          addLicenceFlow: {
            selectedAddressId: '1234'
          }
        }
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
