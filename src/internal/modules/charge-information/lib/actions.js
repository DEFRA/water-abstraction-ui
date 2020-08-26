const { find } = require('lodash');
const moment = require('moment');
const DATE_FORMAT = 'YYYY-MM-DD';

const ACTION_TYPES = {
  setReason: 'set.reason',
  setStartDate: 'set.startDate'
};

const setChangeReasonAction = (request, formValues) => {
  const changeReason = find(request.pre.changeReasons, { changeReasonId: formValues.reason });
  return {
    type: ACTION_TYPES.setReason,
    changeReason
  };
};

const setStartDate = (request, formValues) => {
  const dates = {
    today: moment().format(DATE_FORMAT),
    licenceStartDate: request.pre.licence.startDate,
    customDate: formValues.customDate
  };

  return {
    type: ACTION_TYPES.setStartDate,
    startDate: dates[formValues.startDate]
  };
};

exports.ACTION_TYPES = ACTION_TYPES;
exports.setChangeReasonAction = setChangeReasonAction;
exports.setStartDate = setStartDate;
