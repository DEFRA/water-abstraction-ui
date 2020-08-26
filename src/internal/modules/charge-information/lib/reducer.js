const { ACTION_TYPES } = require('./actions');

const reducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.setReason:
      return {
        ...state,
        changeReason: action.changeReason
      };

    case ACTION_TYPES.setStartDate:
      return {
        ...state,
        startDate: action.startDate
      };
  }

  return state;
};

exports.reducer = reducer;
