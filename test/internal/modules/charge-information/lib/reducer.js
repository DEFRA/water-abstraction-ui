'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');

const { reducer } = require('../../../../../src/internal/modules/charge-information/lib/reducer');
const { ACTION_TYPES } = require('../../../../../src/internal/modules/charge-information/lib/actions');

experiment('internal/modules/charge-information/lib/reducer', () => {
  let initialState;

  beforeEach(async () => {
    initialState = {
      changeReason: 'test-change-reason',
      startDate: 'test-start-date',
      abstractionData: 'test-abstraction-data',
      billingAccount: 'test-billing-account-data'
    };
  });

  experiment('when the action is setReason', () => {
    let action;
    let state;

    beforeEach(async () => {
      action = {
        type: ACTION_TYPES.setReason,
        payload: 'updated-change-reason'
      };

      state = reducer(initialState, action);
    });

    test('the changeReason is updated', async () => {
      expect(state.changeReason).to.equal('updated-change-reason');
    });

    test('the other data is untouched', async () => {
      expect(state.startDate).to.equal(initialState.startDate);
      expect(state.abstractionData).to.equal(initialState.abstractionData);
      expect(state.billingAccount).to.equal(initialState.billingAccount);
    });
  });

  experiment('when the action is setStartDate', () => {
    let action;
    let state;

    beforeEach(async () => {
      action = {
        type: ACTION_TYPES.setStartDate,
        payload: {
          dateRange: { startDate: 'updated-start-date' }
        }
      };

      state = reducer(initialState, action);
    });

    test('the startDate is updated', async () => {
      expect(state.dateRange.startDate).to.equal('updated-start-date');
    });
  });

  experiment('when the action is setChargeElementData', () => {
    let action;
    let state;

    beforeEach(async () => {
      action = {
        type: ACTION_TYPES.setChargeElementData,
        payload: 'updated-abstraction-data'
      };

      state = reducer(initialState, action);
    });

    test('the abstractionData is updated', async () => {
      expect(state.chargeElements).to.equal('updated-abstraction-data');
    });

    test('the other data is untouched', async () => {
      expect(state.changeReason).to.equal(initialState.changeReason);
      expect(state.billingAccount).to.equal(initialState.billingAccount);
      expect(state.startDate).to.equal(initialState.startDate);
    });
  });

  experiment('when the reason is setBillingAccount', () => {
    let action;
    let state;
    const BILLING_ACCOUNT_ID = 'test-new-id';

    beforeEach(async () => {
      action = {
        type: ACTION_TYPES.setBillingAccount,
        payload: {
          billingAccountId: BILLING_ACCOUNT_ID
        }
      };

      state = reducer(initialState, action);
    });

    test('the abstractionData is updated', async () => {
      expect(state.invoiceAccount).to.equal({
        id: BILLING_ACCOUNT_ID
      });
    });

    test('the other data is untouched', async () => {
      expect(state.changeReason).to.equal(initialState.changeReason);
      expect(state.startDate).to.equal(initialState.startDate);
      expect(state.abstractionData).to.equal(initialState.abstractionData);
    });
  });

  experiment('when the action is clearData', () => {
    test('the data is all cleared is updated', async () => {
      const action = { type: ACTION_TYPES.clearData };
      const state = reducer(initialState, action);
      expect(state).to.equal({});
    });
  });
});
