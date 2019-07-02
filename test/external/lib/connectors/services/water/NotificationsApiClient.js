const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const { expect } = require('code');
const sandbox = require('sinon').createSandbox();
const NotificationsApiClient = require('external/lib/connectors/services/water/NotificationsApiClient');

experiment('external/NotificationsApiClient', () => {
  let logger;
  let config;
  let client;

  beforeEach(async () => {
    logger = {
      error: sandbox.spy()
    };
    config = {
      services: {
        water: 'https://example.com/water'
      },
      jwt: {
        token: 'test-jwt-token'
      }
    };
    client = new NotificationsApiClient(config, logger);

    sandbox.stub(client, 'create').resolves({});
    sandbox.stub(client, 'sendNotifyMessage').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('construction', () => {
    test('creates the expected endpoint URL', async () => {
      expect(client.getUrl()).to.equal('https://example.com/water/notification');
    });

    test('sets the JWT in the client headers', async () => {
      expect(client.config.headers.Authorization).to.equal('test-jwt-token');
    });

    test('adds the base service URL to the config', async () => {
      expect(client.config.serviceUrl).to.equal('https://example.com/water');
    });
  });

  experiment('sendSecurityCode', () => {
    experiment('when the address length <= 6', () => {
      let personalisation;
      let accessCode;
      let fao;
      beforeEach(async () => {
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

        await client.sendSecurityCode(licence, fao, accessCode);

        personalisation = client.sendNotifyMessage.lastCall.args[2];
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

    experiment('when address length > 6', () => {
      let personalisation;
      let accessCode;
      let fao;

      beforeEach(async () => {
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

        await client.sendSecurityCode(licence, fao, accessCode);

        personalisation = client.sendNotifyMessage.lastCall.args[2];
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

    experiment('when FAO Provided', () => {
      let personalisation;
      let accessCode;
      let fao;
      let licence1;
      let licence2;

      beforeEach(async () => {
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

      test('the message personalisation adds the FAO name to address_line_1 if address is 6 lines long', async () => {
        await client.sendSecurityCode(licence1, fao, accessCode);

        personalisation = client.sendNotifyMessage.lastCall.args[2];
        expect(personalisation.address_line_1).to.equal('fao name, Holder Name');
        expect(personalisation.address_line_2).to.equal('one');
        expect(personalisation.address_line_3).to.equal('two');
        expect(personalisation.address_line_4).to.equal('three');
        expect(personalisation.address_line_5).to.equal('town');
        expect(personalisation.address_line_6).to.equal('county');
      });

      test('the message personalisation adds the FAO name to address_line_1 if address is 6 lines long', async () => {
        await client.sendSecurityCode(licence2, fao, accessCode);

        personalisation = client.sendNotifyMessage.lastCall.args[2];
        expect(personalisation.address_line_1).to.equal('fao name');
        expect(personalisation.address_line_2).to.equal('Holder Name');
        expect(personalisation.address_line_3).to.equal('one');
        expect(personalisation.address_line_4).to.equal('two');
        expect(personalisation.address_line_5).to.equal('town');
        expect(personalisation.address_line_6).to.equal('county');
      });
    });
  });

  experiment('.sendAccessNotification', () => {
    experiment('for a new user', () => {
      beforeEach(async () => {
        await client.sendAccessNotification({
          newUser: true,
          email: 'recipient@example.com',
          sender: 'sender@example.com'
        });
      });

      test('the share_new_user message ref is used', async () => {
        const [messageRef] = client.sendNotifyMessage.lastCall.args;
        expect(messageRef).to.equal('share_new_user');
      });

      test('the message is send to the expected recipient', async () => {
        const [, recipient] = client.sendNotifyMessage.lastCall.args;
        expect(recipient).to.equal('recipient@example.com');
      });

      test('the personalisation object is configured is send to the expected recipient', async () => {
        const [, , personalisation] = client.sendNotifyMessage.lastCall.args;
        expect(personalisation.link).to.endWith('/reset_password?utm_source=system&utm_medium=email&utm_campaign=share_new_user');
        expect(personalisation.email).to.equal('recipient@example.com');
        expect(personalisation.sender).to.equal('sender@example.com');
      });
    });

    experiment('for an existing user', () => {
      beforeEach(async () => {
        await client.sendAccessNotification({
          email: 'recipient@example.com',
          sender: 'sender@example.com'
        });
      });

      test('the share_existing_user message ref is used', async () => {
        const [messageRef] = client.sendNotifyMessage.lastCall.args;
        expect(messageRef).to.equal('share_existing_user');
      });

      test('the message is send to the expected recipient', async () => {
        const [, recipient] = client.sendNotifyMessage.lastCall.args;
        expect(recipient).to.equal('recipient@example.com');
      });

      test('the personalisation object is configured is send to the expected recipient', async () => {
        const [, , personalisation] = client.sendNotifyMessage.lastCall.args;
        expect(personalisation.link).to.not.endWith('/reset_password?utm_source=system&utm_medium=email&utm_campaign=share_new_user');
        expect(personalisation.email).to.equal('recipient@example.com');
        expect(personalisation.sender).to.equal('sender@example.com');
      });
    });

    experiment('when there is an error', () => {
      let result;

      beforeEach(async () => {
        client.sendNotifyMessage.rejects({ error: 'some-error' });
        result = await client.sendAccessNotification({
          email: 'recipient@example.com',
          sender: 'sender@example.com'
        });
      });

      test('the error is logged', async () => {
        const [msg, err] = logger.error.lastCall.args;
        expect(msg).to.equal('Error sending access notification');
        expect(err).to.equal({ error: 'some-error' });
      });

      test('the error is returned', async () => {
        expect(result).to.equal({ error: 'some-error' });
      });
    });
  });
});
