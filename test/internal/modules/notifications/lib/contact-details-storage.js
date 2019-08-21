'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const contactDetailsStorage = require('internal/modules/notifications/lib/contact-details-storage');
const services = require('internal/lib/connectors/services');

const contact = {
  name: 'Test Person',
  jobTitle: 'Environment officer',
  tel: '01234 567890',
  email: 'test@example.com',
  address: '1 River Lane, Borehole Lane, Splashbury, SS1 1PB'
};

const SESSION_KEY = 'contactDetailsFlow';

experiment('internal/modules/notifications/lib/contact-details-storage.js', () => {
  let request, result;

  beforeEach(async () => {
    request = {
      yar: {
        get: sandbox.stub(),
        set: sandbox.stub(),
        clear: sandbox.stub()
      },
      defra: {
        user: {
          user_data: {
            foo: 'bar',
            contactDetails: contact
          }
        }
      }
    };
    sandbox.stub(services.idm.users, 'updateOne');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.get', () => {
    experiment('when user data is present in session', () => {
      experiment('when contact details are present', () => {
        beforeEach(async () => {
          request.yar.get.returns({
            contactDetails: contact
          });
          result = contactDetailsStorage.get(request);
        });

        test('the correct session key is used', async () => {
          expect(request.yar.get.calledWith(SESSION_KEY))
            .to.be.true();
        });

        test('the session is not updated', async () => {
          expect(request.yar.set.called).to.be.false();
        });

        test('the contact details are returned', async () => {
          expect(result).to.equal(contact);
        });
      });

      experiment('when contact details are not present', () => {
        beforeEach(async () => {
          request.yar.get.returns({

          });
          result = contactDetailsStorage.get(request);
        });

        test('an empty object is returned', async () => {
          expect(result).to.equal({});
        });
      });
    });

    experiment('when user data is not present in session', () => {
      beforeEach(async () => {
        request.yar.get.returns();
        result = contactDetailsStorage.get(request);
      });

      test('user data from request.defra is stored in session', async () => {
        expect(request.yar.set.calledWith(
          SESSION_KEY, request.defra.user.user_data
        )).to.be.true();
      });

      test('the contact details are returned', async () => {
        expect(result).to.equal(request.defra.user.user_data.contactDetails);
      });
    });
  });

  experiment('.set', () => {
    beforeEach(async () => {
      request.yar.get.returns({
        foo: 'bar',
        contactDetails: contact
      });
      contactDetailsStorage.set(request, {
        jobTitle: 'Permitting officer'
      });
    });

    test('merges existing and new contact details and saves to session', async () => {
      const [key, data] = request.yar.set.lastCall.args;
      expect(key).to.equal(SESSION_KEY);
      expect(data).to.equal({
        'foo': 'bar',
        'contactDetails': {
          'name': 'Test Person',
          'jobTitle': 'Permitting officer',
          'tel': '01234 567890',
          'email': 'test@example.com',
          'address': '1 River Lane, Borehole Lane, Splashbury, SS1 1PB'
        }
      });
    });
  });

  experiment('submit', () => {
    beforeEach(async () => {
      request.yar.get.returns({
        foo: 'bar',
        contactDetails: contact
      });
      await contactDetailsStorage.submit(request, {
        email: 'updated@example.com'
      });
    });

    test('calls idm.users.updateOne with the correct params', async () => {
      const [userId, data] = services.idm.users.updateOne.lastCall.args;
      expect(userId).to.equal(request.defra.userId);
      expect(data).to.equal({
        'user_data': {
          'foo': 'bar',
          'contactDetails': {
            'name': 'Test Person',
            'jobTitle': 'Environment officer',
            'tel': '01234 567890',
            'email': 'updated@example.com',
            'address': '1 River Lane, Borehole Lane, Splashbury, SS1 1PB'
          }
        }
      });
    });
  });
});
