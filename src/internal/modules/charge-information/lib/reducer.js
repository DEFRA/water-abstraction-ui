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
        ...action.payload
      };

    case ACTION_TYPES.setBillingAccount:
      return {
        ...state,
        invoiceAccount: {
          id: action.payload.billingAccountId
        }
      };

    case ACTION_TYPES.setAbstractionData:
      return {
        ...state,
        note: action.payload.note,
        chargeElements: action.payload.chargeElements
      };

    case ACTION_TYPES.setChargeElementData:
    case ACTION_TYPES.updateChargeCategory:
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
            ...action.payload,
            isSection127AgreementEnabled: true
          }
        ]
      };
    case ACTION_TYPES.createChargeCategory:
      return {
        ...state,
        scheme: 'sroc',
        chargeElements: action.payload
      };
    case ACTION_TYPES.clearData:
      return {};
  }

  return state;
};

exports.reducer = reducer;
