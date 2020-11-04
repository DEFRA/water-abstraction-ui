'use strict';

const { expect } = require('@hapi/code');
const {
  beforeEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const routing = require('internal/modules/returns-notifications/lib/routing');

experiment('internal/modules/returns-notifications/lib/routing', () => {
  experiment('.getSelectAddressRedirect', () => {
    let request;

    beforeEach(async () => {
      request = {
        params: {
          documentId: 'test-document-id'
        },
        payload: {
          selectedRole: 'createOneTimeAddress'
        }
      };
    });

    test('returns the "one time address" route path if the selected role is "createOneTimeAddress"', async () => {
      const path = routing.getSelectAddressRedirect(request);
      expect(path).to.equal('/returns-notifications/test-document-id/recipient');
    });

    test('returns the "check answers" route path otherwise', async () => {
      request.payload.selectedRole = 'licenceHolder';
      const path = routing.getSelectAddressRedirect(request);
      expect(path).to.equal('/returns-notifications/check-answers');
    });
  });
});
