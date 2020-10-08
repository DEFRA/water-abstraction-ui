'use strict';

const { ACTION_TYPES } = require('./actions');
const { getDefaultStartDate } = require('./date-helpers');

const reducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.setAgreementType:
      const { financialAgreementCode: code } = action.payload;
      return {
        ...state,
        code
      };

    case ACTION_TYPES.setDateSigned:
      const { dateSigned, licenceStartDate } = action.payload;
      return {
        ...state,
        dateSigned,
        startDate: getDefaultStartDate(dateSigned, licenceStartDate)
      };

    case ACTION_TYPES.setStartDate:
      const { isCustomStartDate, startDate } = action.payload;
      return isCustomStartDate ? {
        ...state,
        ...isCustomStartDate && { startDate }
      } : state;
  }

  return state;
};

exports.reducer = reducer;
