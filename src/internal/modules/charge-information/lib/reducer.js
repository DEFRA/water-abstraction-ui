const { ACTION_TYPES } = require('./actions');
const { omit } = require('lodash');

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
    case ACTION_TYPES.createChargeCategory:
      return {
        ...state,
        draftChargeCategory: { id: action.payload.id }
      };

    case ACTION_TYPES.setChargeCategoryData:
      return {
        ...state,
        draftChargeCategory: action.payload
      };
    case ACTION_TYPES.saveChargeCategory:
      return {
        ...(omit(state, 'chargeElements')),
        draftChargeCategory: action.payload
      };
    case ACTION_TYPES.clearData:
      return {};
  }

  return state;
};

exports.reducer = reducer;
