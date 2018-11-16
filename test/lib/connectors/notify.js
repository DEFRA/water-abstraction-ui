const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('code');
const { beforeEach, afterEach, experiment, test } = exports.lab = require('lab').script();
const waterConnector = require('../../../src/lib/connectors/water');
const notifyConnector = require('../../../src/lib/connectors/notify');

experiment('sendSecurityCode', () => {
  let personalisation;
  let accessCode;

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

    await notifyConnector.sendSecurityCode(licence, accessCode);

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
