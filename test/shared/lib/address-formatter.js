const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const addressFormatter = require('shared/lib/address-formatter');

experiment('address-formatter', () => {
  experiment('.createAddress', () => {
    test('trims the content', async () => {
      const licence = {
        metadata: {
          Name: '  Mr Padded  ',
          AddressLine1: '  Left',
          AddressLine2: 'Right  '
        }
      };

      const address = addressFormatter.createAddress(licence);

      expect(address.address_line_1).to.equal('Mr Padded');
      expect(address.address_line_2).to.equal('Left');
      expect(address.address_line_3).to.equal('Right');
    });

    test('drops the fourth address line if all parts are present', async () => {
      const licence = {
        metadata: {
          Name: 'name',
          AddressLine1: 'one',
          AddressLine2: 'two',
          AddressLine3: 'three',
          AddressLine4: 'four',
          Town: 'town',
          County: 'county',
          Postcode: 'AB1 2CD'
        }
      };

      const address = addressFormatter.createAddress(licence);

      expect(address.address_line_1).to.equal('name');
      expect(address.address_line_2).to.equal('one');
      expect(address.address_line_3).to.equal('two');
      expect(address.address_line_4).to.equal('three');
      expect(address.address_line_5).to.equal('town');
      expect(address.address_line_6).to.equal('county');
      expect(address.postcode).to.equal('AB1 2CD');
    });

    test('includes the fourth address line if there is space', async () => {
      const licence = {
        metadata: {
          Name: 'name',
          AddressLine1: 'one',
          AddressLine2: 'two',
          AddressLine3: '',
          AddressLine4: 'four',
          Town: 'town',
          County: 'county',
          Postcode: 'AB1 2CD'
        }
      };

      const address = addressFormatter.createAddress(licence);

      expect(address.address_line_1).to.equal('name');
      expect(address.address_line_2).to.equal('one');
      expect(address.address_line_3).to.equal('two');
      expect(address.address_line_4).to.equal('four');
      expect(address.address_line_5).to.equal('town');
      expect(address.address_line_6).to.equal('county');
      expect(address.postcode).to.equal('AB1 2CD');
    });
  });
});
