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
      const { isDateSignedKnown, licenceStartDate } = action.payload;
      const dateSigned = isDateSignedKnown ? action.payload.dateSigned : undefined;
      return {
        ...state,
        dateSigned,
        isDateSignedKnown,
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
