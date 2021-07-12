'use strict';
const Joi = require('joi');

const actionTypes = {
  setFromDate: 'setFromDate',
  setSelectedBills: 'setSelectedBills'
};

const setFromDate = (fromDate, rebillableBills) => ({
  type: actionTypes.setFromDate,
  payload: Joi.object().keys({
    fromDate,
    rebillableBills
  })
});

const setSelectedBills = (selectedBillIds = []) => ({
  type: actionTypes.setSelectedBills,
  payload: Joi.object().keys({
    selectedBillIds
  })
});

exports.actionTypes = actionTypes;
exports.setFromDate = setFromDate;
exports.setSelectedBills = setSelectedBills;
