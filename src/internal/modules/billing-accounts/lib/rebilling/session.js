'use strict';

const moment = require('moment');
const mappers = require('./mappers');

const SessionSlice = require('shared/lib/SessionSlice');
const sessionSlice = new SessionSlice('rebilling');

const setDateFrom = (request, fromDate) => {
  const { billingAccountId } = request.params;

  const bills = request.pre.rebillableBills
    .filter(bill => moment(bill.dateCreated).isSameOrAfter(fromDate, 'day'));

  return sessionSlice.set(request, billingAccountId, {
    fromDate,
    selectedBillIds: bills.map(mappers.getBillId)
  });
};

const getData = request => {
  const { billingAccountId } = request.params;
  return sessionSlice.get(request, billingAccountId);
};

exports.setDateFrom = setDateFrom;
exports.getData = getData;
