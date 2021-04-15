'use strict';

const mapBill = bill => ({
  id: bill.id,
  invoiceNumber: bill.invoiceNumber,
  dateCreated: bill.batch.dateCreated,
  batchType: bill.batch.type
});

const getBillId = bill => bill.id;

exports.mapBill = mapBill;
exports.getBillId = getBillId;
