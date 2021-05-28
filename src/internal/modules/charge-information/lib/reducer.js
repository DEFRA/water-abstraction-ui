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
        invoiceAccount: {
          id: action.payload.billingAccountId
        }
      };

    case ACTION_TYPES.setChargeElementData:
      return {
        ...state,
        chargeElements: action.payload
      };

    case ACTION_TYPES.createChargeElement:
      return {
        ...state,
        chargeElements: [
          ...state.chargeElements,
          {
            id: action.payload.id,
            isSection127AgreementEnabled: true
          }
        ]
      };

    case ACTION_TYPES.clearData:
      return {};
  }

  return state;
};

exports.reducer = reducer;
