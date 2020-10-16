'use strict';
const moment = require('moment');
const DATE_FORMAT = 'YYYY-MM-DD';

const ACTION_TYPES = {
  setInitialState: 'setInitialState'
};

const setInitialState = (request, licences, refDate) => ({
  type: ACTION_TYPES.setInitialState,
  payload: {
    licences,
    refDate: refDate || moment().format(DATE_FORMAT)
  }
});

exports.ACTION_TYPES = ACTION_TYPES;
exports.setInitialState = setInitialState;
