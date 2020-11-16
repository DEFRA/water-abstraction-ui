'use-strict';

const { ACTION_TYPES } = require('./actions');

const reducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.setReason:
      return {
        ...state,
        changeReason: action.payload
      };

    case ACTION_TYPES.setStartDate:
      return {
        ...state,
        dateRange: {
          startDate: action.payload
        }
      };

    case ACTION_TYPES.setBillingAccount:
      return {
        ...state,
        invoiceAccount: action.payload
      };

    case ACTION_TYPES.setChargeElementData:
      return {
        ...state,
        chargeElements: action.payload
      };

    case ACTION_TYPES.clearData:
      return {};
  }

  return state;
};

exports.reducer = reducer;
