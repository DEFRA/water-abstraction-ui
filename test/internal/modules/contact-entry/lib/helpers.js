'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const session = require('internal/modules/contact-entry/lib/session');
const { CONTACT_TYPES } = require('internal/modules/contact-entry/lib/constants');

const helpers = require('internal/modules/contact-entry/lib/helpers');

const CONTACT_ID = 'test-contact-id';

experiment('src/internal/modules/contact-entry/lib/helpers', () => {
  let request, result;
  beforeEach(async () => {
    sandbox.stub(session, 'get').returns({ data: { contactId: CONTACT_ID } });

    request = {
      params: {
        key: 'test-key'
      }
    };
  });

  afterEach(() => sandbox.restore());

  experiment('.getSelectedContact', () => {
    test('returns department data if selected value is "department"', () => {
      result = helpers.getSelectedContact(CONTACT_TYPES.department, 'Department name');
      expect(result).to.equal({
        type: CONTACT_TYPES.department,
        department: 'Department name'
      });
    });

    test('returns contact id if selected value is not "department"', () => {
      result = helpers.getSelectedContact(CONTACT_ID);
      expect(result).to.equal({ contactId: CONTACT_ID });
    });
  });

  experiment('.getContactFromSession', () => {
    test('returns contact data from the session', () => {
      result = helpers.getContactFromSession(request);
      expect(result).to.equal({ contactId: CONTACT_ID });
    });

    test('returns an empty object if no data in the session', () => {
      session.get.returns();
      result = helpers.getContactFromSession(request);
      expect(result).to.equal({});
    });
  });
});
