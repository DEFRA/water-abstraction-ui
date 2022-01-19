'use strict';

const moment = require('moment');
const { actionTypes } = require('./actions');

const getBillId = bill => bill.id;

const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.setSelectedBills: {
      const { selectedBillIds } = action.payload;
      return {
        ...state,
        selectedBillIds
      };
    }

    case actionTypes.setFromDate: {
      const { fromDate, rebillableBills } = action.payload;
      const selectedBills = rebillableBills
        .filter(bill => moment(bill.dateCreated).isSameOrAfter(fromDate, 'day'));
      return {
        ...state,
        fromDate,
        selectedBillIds: selectedBills.map(getBillId)
      };
    }

    default:
      return state;
  }
};

module.exports = reducer;
