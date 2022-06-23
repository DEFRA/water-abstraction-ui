'use strict'

const actionTypes = {
  setFromDate: 'setFromDate',
  setSelectedBills: 'setSelectedBills'
}

const setFromDate = (fromDate, rebillableBills) => ({
  type: actionTypes.setFromDate,
  payload: {
    fromDate,
    rebillableBills
  }
})

const setSelectedBills = (selectedBillIds = []) => ({
  type: actionTypes.setSelectedBills,
  payload: {
    selectedBillIds
  }
})

exports.actionTypes = actionTypes
exports.setFromDate = setFromDate
exports.setSelectedBills = setSelectedBills
