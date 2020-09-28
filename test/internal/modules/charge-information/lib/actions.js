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
  experiment('setChangeReason', () => {
    let request;

    beforeEach(async () => {
      request = {
        pre: {
          changeReasons: [
            { changeReasonId: '00000000-0000-0000-0000-000000000001', description: 'test-1' },
            { changeReasonId: '00000000-0000-0000-0000-000000000002', description: 'test-2' },
            { changeReasonId: '00000000-0000-0000-0000-000000000003', description: 'test-3' }
          ]
        }
      };
    });

    experiment('when the reason is non chargeable', () => {
      test('the payload is a key', async () => {
        const formValues = { reason: 'non-chargeable' };
        const action = actions.setChangeReason(request, formValues);

        expect(action).to.equal({
          type: actions.ACTION_TYPES.setReason,
          payload: {
            changeReasonId: 'non-chargeable'
          }
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
            changeReasonId: '00000000-0000-0000-0000-000000000002',
            description: 'test-2'
          }
        });
      });
    });
  });

  experiment('setStartDate', () => {
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

  experiment('setAbstractionData', () => {
    let request;

    beforeEach(async () => {
      request = {
        pre: {
          defaultCharges: [
            { source: 'unsupportred' }
          ]
        }
      };
    });

    experiment('when the existing data is used', () => {
      test('the abstraction data is added to the action payload', async () => {
        const formValues = { useAbstractionData: true };
        const action = actions.setAbstractionData(request, formValues);

        expect(action.type).to.equal(actions.ACTION_TYPES.setAbstractionData);
        expect(action.payload).to.equal(request.pre.defaultCharges);
      });
    });

    experiment('when the existing data is not used', () => {
      test('the action payload is set to false', async () => {
        const formValues = { useAbstractionData: false };
        const action = actions.setAbstractionData(request, formValues);

        expect(action.type).to.equal(actions.ACTION_TYPES.setAbstractionData);
        expect(action.payload).to.equal([]);
      });
    });
  });

  experiment('setBillingAccount', () => {
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
            billingAccount: null
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
            invoiceAccountAddress: '00000000-0000-0000-0000-000000002222',
            billingAccount: {
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
          }
        });
      });
    });
  });

  experiment('clearData', () => {
    test('returns the expected action with no payload', async () => {
      const action = actions.clearData();
      expect(action).to.equal({
        type: actions.ACTION_TYPES.clearData
      });
    });
  });
});
