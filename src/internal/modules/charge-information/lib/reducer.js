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
        startDate: action.payload
      };

    case ACTION_TYPES.setAbstractionData:
      return {
        ...state,
        chargeElements: action.payload
      };

    case ACTION_TYPES.setBillingAccount:
      return {
        ...state,
        billingAccount: action.payload
      };

    case ACTION_TYPES.clearData:
      return {};
  }

  return state;
};

exports.reducer = reducer;
