'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const moment = require('moment');

const actions = require('internal/modules/charge-information/lib/actions');

experiment('internal/modules/charge-information/lib/actions', () => {
  experiment('.setChangeReason', () => {
    let request;

    beforeEach(async () => {
      request = {
        pre: {
          changeReasons: [
            { id: '00000000-0000-0000-0000-000000000001', description: 'test-1' },
            { id: '00000000-0000-0000-0000-000000000002', description: 'test-2' },
            { id: '00000000-0000-0000-0000-000000000003', description: 'test-3' }
          ]
        }
      };
    });

    experiment('when the reason is non chargeable', () => {
      test('the payload is a key', async () => {
        const formValues = { reason: 'non-chargeable' };
        const action = actions.setChangeReason(request, formValues);

        expect(action).to.equal({
          type: actions.ACTION_TYPES.clearData
        });
      });
    });

    experiment('when the reason is chargeable', () => {
      test('the payload is the change reason', async () => {
        const formValues = { reason: '00000000-0000-0000-0000-000000000002' };
        const action = actions.setChangeReason(request, formValues);

        expect(action).to.equal({
          type: actions.ACTION_TYPES.setReason,
          payload: {
            id: '00000000-0000-0000-0000-000000000002',
            description: 'test-2'
          }
        });
      });
    });
  });

  experiment('.setStartDate', () => {
    let request;

    beforeEach(async () => {
      request = {
        pre: {
          licence: {
            startDate: '2000-01-01'
          }
        }
      };
    });

    test('sets the expected date for "today"', () => {
      const formValues = { startDate: 'today' };
      const action = actions.setStartDate(request, formValues);
      expect(action).to.equal({
        type: actions.ACTION_TYPES.setStartDate,
        payload:
          moment().format('YYYY-MM-DD')
      });
    });

    test('sets the expected date for "licenceStartDate"', () => {
      const formValues = { startDate: 'licenceStartDate' };
      const action = actions.setStartDate(request, formValues);
      expect(action).to.equal({
        type: actions.ACTION_TYPES.setStartDate,
        payload: request.pre.licence.startDate
      });
    });

    test('sets the expected date for "customDate"', () => {
      const formValues = {
        customDate: '2020-02-02',
        startDate: 'customDate'
      };

      const action = actions.setStartDate(request, formValues);

      expect(action).to.equal({
        type: actions.ACTION_TYPES.setStartDate,
        payload: formValues.customDate
      });
    });
  });

  experiment('.setAbstractionData', () => {
    let request;

    beforeEach(async () => {
      request = {
        pre: {
          defaultCharges: [
            { source: 'unsupported' }
          ],
          chargeVersions: [
            { id: 'test-cv-id-1', dateRange: { startDate: '2010-04-20' }, status: 'superseded', chargeElements: [{ source: 'unsupported' }] },
            { id: 'test-cv-id-2', dateRange: { startDate: '2015-04-20' }, status: 'current', chargeElements: [{ source: 'tidal' }] }
          ]
        }
      };
    });

    experiment('when the existing abstraction data is used', () => {
      test('the abstraction data is added to the action payload', async () => {
        const formValues = { useAbstractionData: 'yes' };
        const action = actions.setAbstractionData(request, formValues);

        expect(action.type).to.equal(actions.ACTION_TYPES.setChargeElementData);
        expect(action.payload[0]).to.contain(request.pre.defaultCharges[0]);
      });

      test('the charge elements are assigned a guid id', async () => {
        const formValues = { useAbstractionData: 'yes' };
        const action = actions.setAbstractionData(request, formValues);
        const guidRegex = /^[a-z,0-9]{8}-[a-z,0-9]{4}-[a-z,0-9]{4}-[a-z,0-9]{4}-[a-z,0-9]{12}$/;
        expect(action.payload[0].id).to.match(guidRegex);
      });
    });

    experiment('when the abstraction data is not used', () => {
      test('the action payload is set to false', async () => {
        const formValues = { useAbstractionData: 'no' };
        const action = actions.setAbstractionData(request, formValues);

        expect(action.type).to.equal(actions.ACTION_TYPES.setChargeElementData);
        expect(action.payload).to.equal([]);
      });
    });

    experiment('when the existing charge version data is used', () => {
      test('the charge version data is added to the action payload', async () => {
        const formValues = { useAbstractionData: 'test-cv-id-1' };
        const action = actions.setAbstractionData(request, formValues);

        expect(action.type).to.equal(actions.ACTION_TYPES.setChargeElementData);
        expect(action.payload[0].source).to.equal(request.pre.chargeVersions[0].chargeElements[0].source);
      });

      test('the charge elements are assigned a guid id', async () => {
        const formValues = { useAbstractionData: 'test-cv-id-1' };
        const action = actions.setAbstractionData(request, formValues);
        const guidRegex = /^[a-z,0-9]{8}-[a-z,0-9]{4}-[a-z,0-9]{4}-[a-z,0-9]{4}-[a-z,0-9]{12}$/;
        expect(action.payload[0].id).to.match(guidRegex);
      });
    });
  });

  experiment('.setBillingAccount', () => {
    let request;

    beforeEach(async () => {
      request = {
        pre: {
          billingAccounts: [
            {
              id: '00000000-0000-0000-0000-000000001111',
              invoiceAccountAddresses: [
                {
                  id: '00000000-0000-0000-0000-000000002222',
                  invoiceAccountId: '00000000-0000-0000-0000-000000001111'
                },
                {
                  id: '00000000-0000-0000-0000-000000003333',
                  invoiceAccountId: '00000000-0000-0000-0000-000000001111'
                }
              ],
              accountNumber: 'A10000000A'
            }
          ]
        }
      };
    });

    experiment('when the user wants to set up a new account', () => {
      test('the payload is a key', async () => {
        const formValues = { invoiceAccountAddress: 'set-up-new-billing-account' };
        const action = actions.setBillingAccount(request, formValues);

        expect(action).to.equal({
          type: actions.ACTION_TYPES.setBillingAccount,
          payload: {
            invoiceAccountAddress: 'set-up-new-billing-account',
            invoiceAccount: null
          }
        });
      });
    });

    experiment('when an existing account is selected', () => {
      test('the payload contains the account and the invoice account address id', async () => {
        const formValues = { invoiceAccountAddress: '00000000-0000-0000-0000-000000002222' };
        const action = actions.setBillingAccount(request, formValues);

        expect(action).to.equal({
          type: actions.ACTION_TYPES.setBillingAccount,
          payload: {
            id: '00000000-0000-0000-0000-000000001111',
            invoiceAccountAddress: '00000000-0000-0000-0000-000000002222',
            invoiceAccountAddresses: [
              {
                id: '00000000-0000-0000-0000-000000002222',
                invoiceAccountId: '00000000-0000-0000-0000-000000001111'
              },
              {
                id: '00000000-0000-0000-0000-000000003333',
                invoiceAccountId: '00000000-0000-0000-0000-000000001111'
              }
            ],
            accountNumber: 'A10000000A'
          }
        });
      });
    });
  });

  experiment('.setChargeElementData', () => {
    let request;

    beforeEach(async () => {
      request = {
        params: {
          elementId: 'test-element-id',
          step: 'season'
        },
        pre: {
          draftChargeInformation: {
            chargeElements: [{
              id: 'test-element-id',
              source: 'supported'
            }]
          },
          defaultCharges: {}
        }
      };
    });

    experiment('when the charge element exists', () => {
      test('updates the charge element with form value data', () => {
        const formValues = { season: 'winter' };
        const action = actions.setChargeElementData(request, formValues);
        expect(action).to.equal({
          type: actions.ACTION_TYPES.setChargeElementData,
          payload: [{
            id: 'test-element-id',
            source: 'supported',
            season: 'winter'
          }]
        });
      });
    });

    experiment('when the charge element does not exist', () => {
      beforeEach(() => {
        request.pre.draftChargeInformation.chargeElements = [];
      });
      test('adds a new charge element with form value data and an id', () => {
        const formValues = { season: 'winter' };
        const action = actions.setChargeElementData(request, formValues);
        expect(action).to.equal({
          type: actions.ACTION_TYPES.setChargeElementData,
          payload: [{
            id: 'test-element-id',
            season: 'winter'
          }]
        });
      });
    });
  });

  experiment('.removeChargeElement', () => {
    let request;

    beforeEach(async () => {
      request = {
        payload: {
          buttonAction: 'removeElement:test-element-1-id'
        },
        pre: {
          draftChargeInformation: {
            chargeElements: [{
              id: 'test-element-1-id',
              source: 'supported'
            }, {
              id: 'test-element-2-id',
              source: 'unsupported'
            }]
          }
        }
      };
    });

    test('returns the remaining charge elements', () => {
      const action = actions.removeChargeElement(request);
      expect(action).to.equal({
        type: actions.ACTION_TYPES.setChargeElementData,
        payload: [{
          id: 'test-element-2-id',
          source: 'unsupported'
        }]
      });
    });
  });

  experiment('.clearData', () => {
    test('returns the expected action with no payload', async () => {
      const action = actions.clearData();
      expect(action).to.equal({
        type: actions.ACTION_TYPES.clearData
      });
    });
  });
});
