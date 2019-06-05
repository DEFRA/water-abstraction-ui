const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('code');
const { beforeEach, afterEach, experiment, test } = exports.lab = require('lab').script();
const waterConnector = require('../../../../src/internal/lib/connectors/water');
const notifyConnector = require('../../../../src/internal/lib/connectors/notify');

experiment('sendSecurityCode', () => {
  experiment('Address Length <=6', () => {
    let personalisation;
    let accessCode;
    let fao;
    beforeEach(async () => {
      sandbox.stub(waterConnector, 'sendNotifyMessage').resolves({});

      accessCode = '123ab';
      const licence = {
        metadata: {
          AddressLine1: 'one',
          AddressLine2: 'two',
          AddressLine3: 'three',
          AddressLine4: '',
          Town: 'town',
          County: 'county',
          Postcode: 'AB1 2CD',
          Name: 'Holder Name'
        }
      };

      await notifyConnector.sendSecurityCode(licence, fao, accessCode);

      personalisation = waterConnector.sendNotifyMessage.args[0][2];
    });

    afterEach(async () => {
      sandbox.restore();
    });

    test('the message personalisation includes the access code', async () => {
      expect(personalisation.accesscode).to.equal(accessCode);
    });

    test('the message personalisation includes the postcode', async () => {
      expect(personalisation.postcode).to.equal('AB1 2CD');
    });

    test('the message personalisation includes the licence holder name', async () => {
      expect(personalisation.licenceholder).to.equal('Holder Name');
    });

    test('the message personalisation contains the address including the licence holder name', async () => {
      expect(personalisation.address_line_1).to.equal('Holder Name');
      expect(personalisation.address_line_2).to.equal('one');
      expect(personalisation.address_line_3).to.equal('two');
      expect(personalisation.address_line_4).to.equal('three');
      expect(personalisation.address_line_5).to.equal('town');
      expect(personalisation.address_line_6).to.equal('county');
    });
  });
  experiment('Address Length > 6', () => {
    let personalisation;
    let accessCode;
    let fao;
    beforeEach(async () => {
      sandbox.stub(waterConnector, 'sendNotifyMessage').resolves({});

      accessCode = '123ab';
      const licence = {
        metadata: {
          AddressLine1: 'one',
          AddressLine2: 'two',
          AddressLine3: 'three',
          AddressLine4: 'four',
          Town: 'town',
          County: 'county',
          Postcode: 'AB1 2CD',
          Name: 'Holder Name'
        }
      };

      await notifyConnector.sendSecurityCode(licence, fao, accessCode);

      personalisation = waterConnector.sendNotifyMessage.args[0][2];
    });

    afterEach(async () => {
      sandbox.restore();
    });

    test('the message personalisation removes AddressLine4 when there are too many licences fields', async () => {
      expect(personalisation.address_line_1).to.equal('Holder Name');
      expect(personalisation.address_line_2).to.equal('one');
      expect(personalisation.address_line_3).to.equal('two');
      expect(personalisation.address_line_4).to.equal('three');
      expect(personalisation.address_line_5).to.equal('town');
      expect(personalisation.address_line_6).to.equal('county');
    });
  });

  experiment('FAO Provided', () => {
    let personalisation;
    let accessCode;
    let fao;
    let licence1;
    let licence2;
    beforeEach(async () => {
      sandbox.stub(waterConnector, 'sendNotifyMessage').resolves({});

      accessCode = '123ab';
      fao = 'fao name';
      licence1 = {
        metadata: {
          AddressLine1: 'one',
          AddressLine2: 'two',
          AddressLine3: 'three',
          AddressLine4: '',
          Town: 'town',
          County: 'county',
          Postcode: 'AB1 2CD',
          Name: 'Holder Name'
        }
      };
      licence2 = {
        metadata: {
          AddressLine1: 'one',
          AddressLine2: 'two',
          AddressLine3: '',
          AddressLine4: '',
          Town: 'town',
          County: 'county',
          Postcode: 'AB1 2CD',
          Name: 'Holder Name'
        }
      };
    });

    afterEach(async () => {
      sandbox.restore();
    });

    test('the message personalisation adds the FAO name to address_line_1 if address is 6 lines long', async () => {
      await notifyConnector.sendSecurityCode(licence1, fao, accessCode);

      personalisation = waterConnector.sendNotifyMessage.args[0][2];
      expect(personalisation.address_line_1).to.equal('fao name, Holder Name');
      expect(personalisation.address_line_2).to.equal('one');
      expect(personalisation.address_line_3).to.equal('two');
      expect(personalisation.address_line_4).to.equal('three');
      expect(personalisation.address_line_5).to.equal('town');
      expect(personalisation.address_line_6).to.equal('county');
    });

    test('the message personalisation adds the FAO name to address_line_1 if address is 6 lines long', async () => {
      await notifyConnector.sendSecurityCode(licence2, fao, accessCode);

      personalisation = waterConnector.sendNotifyMessage.args[0][2];
      expect(personalisation.address_line_1).to.equal('fao name');
      expect(personalisation.address_line_2).to.equal('Holder Name');
      expect(personalisation.address_line_3).to.equal('one');
      expect(personalisation.address_line_4).to.equal('two');
      expect(personalisation.address_line_5).to.equal('town');
      expect(personalisation.address_line_6).to.equal('county');
    });
  });
});

experiment('createAddress', () => {
  test('trims the content', async () => {
    const licence = {
      metadata: {
        Name: '  Mr Padded  ',
        AddressLine1: '  Left',
        AddressLine2: 'Right  '
      }
    };

    const address = notifyConnector.createAddress(licence);

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

    const address = notifyConnector.createAddress(licence);

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

    const address = notifyConnector.createAddress(licence);

    expect(address.address_line_1).to.equal('name');
    expect(address.address_line_2).to.equal('one');
    expect(address.address_line_3).to.equal('two');
    expect(address.address_line_4).to.equal('four');
    expect(address.address_line_5).to.equal('town');
    expect(address.address_line_6).to.equal('county');
    expect(address.postcode).to.equal('AB1 2CD');
  });
});
