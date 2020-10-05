'use strict';

const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');

const formHelpers = require('internal/modules/charge-information/lib/form-helpers');

const createRequest = (options = {}) => ({
  params: {
    elementId: 'test-element-id',
    licenceId: 'test-licence-id'
  },
  query: options.query || {},
  pre: {
    draftChargeInformation: {
      chargeElements: options.chargeElements || []
    }
  }
});

experiment('internal/modules/charge-information/lib/form-helpers', () => {
  experiment('.getChargeElementData', () => {
    test('returns the charge element that matches the elementId', async () => {
      const chargeElements = [{
        id: 'test-element-id',
        season: 'summer',
        source: 'supported'
      }, {
        id: 'test-element-id-2',
        season: 'winter',
        source: 'supported'
      }];
      const chargeElement = formHelpers.getChargeElementData(createRequest({ chargeElements }));
      expect(chargeElement).to.equal(chargeElements[0]);
    });

    test('returns empty object, when the charge element does not exist', async () => {
      const chargeElement = formHelpers.getChargeElementData(createRequest());
      expect(chargeElement).to.equal({});
    });
  });

  experiment('.getActionUrl', () => {
    test('returns the url as is when returnToCheckData query param is not present', async () => {
      const actionUrl = formHelpers.getActionUrl(createRequest(), 'test-url');
      expect(actionUrl).to.equal('test-url');
    });

    test('appends a query string to url when returnToCheckData query param is present', async () => {
      const actionUrl = formHelpers.getActionUrl(createRequest({ query: { returnToCheckData: 1 } }), 'test-url');
      expect(actionUrl).to.equal('test-url?returnToCheckData=1');
    });
  });

  experiment('.getChargeElementActionUrl', () => {
    const request = createRequest();
    const { licenceId, elementId } = request.params;
    const step = 'test-step';
    const chargeElementStepUrl = `/licences/${licenceId}/charge-information/charge-element/${elementId}/${step}`;
    test('returns the expected url with no query string when returnToCheckData query param is not present', async () => {
      const actionUrl = formHelpers.getChargeElementActionUrl(createRequest(), step);
      expect(actionUrl).to.equal(chargeElementStepUrl);
    });

    test('appends a query string to the expected url when returnToCheckData query param is present', async () => {
      const actionUrl = formHelpers.getChargeElementActionUrl(createRequest({ query: { returnToCheckData: 1 } }), step);
      expect(actionUrl).to.equal(`${chargeElementStepUrl}?returnToCheckData=1`);
    });
  });
});
